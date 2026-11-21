import { promises as fs } from "fs";
import { lookup } from "dns/promises";
import { isIP } from "net";
import * as path from "path";

/**
 * Rules for the files and URLs a chat loads from `images` and `files`. Safe defaults apply with
 * no rules set: files that hold secrets and cloud metadata addresses are refused, and remote
 * files time out. Set more rules when a path or URL can come from a user.
 */
export interface FileSecurity {
  /** Local files must be inside this folder (after following links). */
  root?: string;
  /**
   * Load files that usually hold secrets, which are refused by default: `.env` files, `.npmrc`,
   * `.netrc`, SSH and cloud credentials, and keys and certificates (`.pem`, `.key`, `.p12`, ...).
   */
  allowSensitiveFiles?: boolean;
  /**
   * Refuse URLs whose host is, or resolves to, any private, loopback or link-local address.
   * Cloud metadata addresses are refused even without it.
   */
  blockPrivateNetwork?: boolean;
  /** Only these hosts may be fetched, such as `["cdn.example.com"]`. */
  allowedHosts?: string[];
  /**
   * When a URL can't be fetched, throw instead of passing the URL itself to the provider, which
   * would fetch it from its side. A refused URL always throws.
   */
  throwOnFetchError?: boolean;
  /** Milliseconds to wait for a remote file. Default 60000. */
  fetchTimeout?: number;
}

/** Thrown when a file or URL breaks a FileSecurity rule. */
export class FileAccessError extends Error {
  readonly code = "FILE_ACCESS_DENIED";
  constructor(message: string) {
    super(message);
    this.name = "FileAccessError";
  }
}

export const DEFAULT_FETCH_TIMEOUT = 60_000;
const MAX_REDIRECTS = 5;

const SENSITIVE_EXTENSIONS = new Set([
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".jks",
  ".keystore",
  ".kdbx",
  ".ppk",
  ".gpg",
  ".asc"
]);
const SENSITIVE_NAMES = new Set([
  ".npmrc",
  ".netrc",
  ".pgpass",
  ".git-credentials",
  ".htpasswd",
  ".pypirc",
  ".dockercfg",
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "credentials",
  "authorized_keys",
  "known_hosts",
  "shadow",
  "master.key"
]);
const SENSITIVE_FOLDERS = new Set([".ssh", ".aws", ".gnupg", ".kube", ".docker"]);

/** Whether a file name or its folders look like a place secrets are kept. */
export function isSensitiveFile(filePath: string): boolean {
  const parts = path.resolve(filePath).split(path.sep);
  const name = (parts[parts.length - 1] ?? "").toLowerCase();
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (SENSITIVE_NAMES.has(name)) return true;
  if (SENSITIVE_EXTENSIONS.has(path.extname(name))) return true;
  return parts.slice(0, -1).some((part) => SENSITIVE_FOLDERS.has(part.toLowerCase()));
}

/** Checks a local path against the rules; returns the path to read. */
export async function checkLocalFile(filePath: string, rules: FileSecurity = {}): Promise<string> {
  const name = path.basename(filePath);
  let target = filePath;
  if (rules.root) {
    const root = await fs.realpath(path.resolve(rules.root));
    const real = await fs.realpath(path.resolve(filePath));
    const relative = path.relative(root, real);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new FileAccessError(`Refused to load ${name}: it is outside the allowed folder.`);
    }
    target = real;
  }
  if (!rules.allowSensitiveFiles) {
    // Checked on the real path too, so a link with a harmless name can't reach a key.
    const real = await fs.realpath(path.resolve(filePath)).catch(() => filePath);
    if (isSensitiveFile(filePath) || isSensitiveFile(real)) {
      throw new FileAccessError(
        `Refused to load ${name}: it may hold secrets. Set fileSecurity.allowSensitiveFiles to load it.`
      );
    }
  }
  return target;
}

const METADATA_HOSTS = new Set(["metadata.google.internal", "metadata", "instance-data"]);

/** Whether an address serves cloud instance metadata, which holds credentials. */
export function isMetadataAddress(address: string): boolean {
  const ip = address.toLowerCase();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isMetadataAddress(mapped[1]!);
  return ip.startsWith("169.254.") || ip === "fd00:ec2::254" || ip === "100.100.100.200";
}

/** Checks one URL against the rules before it is fetched. */
export async function checkRemoteUrl(url: string, rules: FileSecurity = {}): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new FileAccessError(`Refused to fetch ${url}: not a valid URL.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new FileAccessError(`Refused to fetch ${parsed.protocol} URLs.`);
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (rules.allowedHosts && !rules.allowedHosts.some((allowed) => allowed.toLowerCase() === host)) {
    throw new FileAccessError(`Refused to fetch from ${host}: not an allowed host.`);
  }
  if (METADATA_HOSTS.has(host)) {
    throw new FileAccessError(`Refused to fetch from ${host}: it serves cloud instance metadata.`);
  }
  let addresses: string[];
  if (isIP(host)) addresses = [host];
  else {
    try {
      addresses = (await lookup(host, { all: true, verbatim: true })).map((entry) => entry.address);
    } catch {
      return; // Unresolvable: the fetch fails on its own.
    }
  }
  if (addresses.some(isMetadataAddress)) {
    throw new FileAccessError(`Refused to fetch from ${host}: it serves cloud instance metadata.`);
  }
  if (rules.blockPrivateNetwork && addresses.some(isPrivateAddress)) {
    throw new FileAccessError(`Refused to fetch from ${host}: it is a private address.`);
  }
}

/**
 * Fetches a URL, checking it and every redirect it follows against the rules, so a public URL
 * can't redirect to a metadata or private address.
 */
export async function fetchChecked(url: string, rules: FileSecurity = {}): Promise<Response> {
  const signal = AbortSignal.timeout(rules.fetchTimeout ?? DEFAULT_FETCH_TIMEOUT);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await checkRemoteUrl(current, rules);
    const response = await fetch(current, { redirect: "manual", signal });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw new Error(`Too many redirects fetching ${url}.`);
}

/** Whether an IP address is loopback, private, link-local, shared or otherwise not public. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]!);
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (isIP(ip) === 6) {
    return (
      ip === "::" ||
      ip === "::1" ||
      /^f[cd]/.test(ip) ||
      /^fe[89ab]/.test(ip) ||
      ip.startsWith("ff")
    );
  }
  return true;
}
