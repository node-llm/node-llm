import fs from "fs";
import { lookup as dnsLookup, type LookupAddress } from "dns";
import { lookup } from "dns/promises";
import { isIP } from "net";
import * as http from "http";
import * as https from "https";
import * as path from "path";

/**
 * Rules for the files and URLs a chat loads from `images` and `files`. Safe defaults apply with
 * no rules set: files that hold secrets, files that aren't regular files, files over 100 MB and
 * cloud metadata addresses are refused, and remote files time out. Set more rules when a path or
 * URL can come from a user.
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
/** The largest remote file that is read, in bytes. */
export const MAX_REMOTE_BYTES = 50 * 1024 * 1024;
/** The largest local file that is read, in bytes. */
export const MAX_LOCAL_BYTES = 100 * 1024 * 1024;
const MAX_REDIRECTS = 5;

/** fs calls that report a failure as undefined, so a path that can't be checked is read as before. */
async function realpathOf(filePath: string): Promise<string> {
  try {
    return await fs.promises.realpath(path.resolve(filePath));
  } catch {
    return path.resolve(filePath);
  }
}

async function statOf(filePath: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.stat(filePath);
  } catch {
    return undefined;
  }
}

/** A response header, for responses that may be mocks without `headers`. */
export function headerOf(response: Response, name: string): string | null {
  return typeof response.headers?.get === "function" ? response.headers.get(name) : null;
}

/** Rules from config, then from the chat, the chat's winning where both set one. */
export function mergeFileSecurity(
  ...layers: Array<FileSecurity | undefined>
): FileSecurity | undefined {
  const set = layers.filter((layer): layer is FileSecurity => Boolean(layer));
  if (set.length === 0) return undefined;
  return Object.assign({}, ...set);
}

// ---------------------------------------------------------------------------------------------
// Local files

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
  ".asc",
  ".env",
  ".envrc",
  ".tfstate",
  ".tfvars",
  ".ovpn",
  ".keytab"
]);
const SENSITIVE_NAMES = new Set([
  ".npmrc",
  ".envrc",
  ".yarnrc.yml",
  ".netrc",
  ".pgpass",
  ".my.cnf",
  ".git-credentials",
  ".htpasswd",
  ".pypirc",
  ".dockercfg",
  ".vault-token",
  ".boto",
  ".s3cfg",
  ".bash_history",
  ".zsh_history",
  ".psql_history",
  ".mysql_history",
  "credentials",
  "credentials.json",
  "application_default_credentials.json",
  "authorized_keys",
  "known_hosts",
  "shadow",
  "master.key",
  "secrets.yml",
  "secrets.yaml",
  "secrets.json",
  "database.yml",
  "wallet.dat",
  "environ"
]);
const SENSITIVE_FOLDERS = new Set([".ssh", ".aws", ".gnupg", ".kube", ".docker", ".git", ".azure"]);
// Pseudo-files with process environments, memory and devices.
const SYSTEM_PREFIXES = ["/proc/", "/sys/", "/dev/"];

/** Whether a file name or its folders look like a place secrets are kept. */
export function isSensitiveFile(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  if (SYSTEM_PREFIXES.some((prefix) => resolved.startsWith(prefix))) return true;
  const parts = resolved.split(path.sep);
  const name = (parts[parts.length - 1] ?? "").toLowerCase();
  // .env, .env.production, .env-local, prod.env
  if (name === ".env" || /^\.env[.\-_]/.test(name)) return true;
  if (SENSITIVE_NAMES.has(name)) return true;
  // id_rsa, id_rsa_work, id_ed25519.bak; service-account.json, my-service-account-key.json
  if (/^id_(?:rsa|dsa|ecdsa|ed25519)/.test(name)) return true;
  if (/service[-_]?account.*\.json$/.test(name)) return true;
  if (SENSITIVE_EXTENSIONS.has(path.extname(name))) return true;
  return parts.slice(0, -1).some((part) => SENSITIVE_FOLDERS.has(part.toLowerCase()));
}

/**
 * Checks a local path against the rules: inside `root` when set, not a file that holds secrets,
 * a regular file (not a device, pipe or folder) and at most 100 MB. Returns the path to read.
 */
export async function checkLocalFile(filePath: string, rules: FileSecurity = {}): Promise<string> {
  const name = path.basename(filePath);
  const real = await realpathOf(filePath);
  let target = filePath;
  if (rules.root) {
    const root = await realpathOf(rules.root);
    const relative = path.relative(root, real);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new FileAccessError(`Refused to load ${name}: it is outside the allowed folder.`);
    }
    target = real;
  }
  // Checked on the real path too, so a link with a harmless name can't reach a key.
  if (!rules.allowSensitiveFiles && (isSensitiveFile(filePath) || isSensitiveFile(real))) {
    throw new FileAccessError(
      `Refused to load ${name}: it may hold secrets. Set fileSecurity.allowSensitiveFiles to load it.`
    );
  }
  // Devices, pipes and sockets can be read without end. A folder or a missing file fails on
  // reading, as before.
  const stat = await statOf(real);
  if (
    stat &&
    (stat.isCharacterDevice() || stat.isBlockDevice() || stat.isFIFO() || stat.isSocket())
  ) {
    throw new FileAccessError(`Refused to load ${name}: it is not a regular file.`);
  }
  if (stat && stat.size > MAX_LOCAL_BYTES) {
    throw new FileAccessError(
      `Refused to load ${name}: it is ${stat.size} bytes, over the ${MAX_LOCAL_BYTES}-byte limit.`
    );
  }
  return target;
}

// ---------------------------------------------------------------------------------------------
// Addresses

/** The eight 16-bit words of an IPv6 address, or undefined for anything else. */
function ipv6Words(address: string): number[] | undefined {
  let text = address.toLowerCase().split("%")[0]!;
  if (isIP(text) !== 6) return undefined;
  let tail: number[] = [];
  const dotted = text.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number) as [number, number, number, number];
    tail = [(a << 8) | b, (c << 8) | d];
    text = text.slice(0, -dotted[0].length);
    if (text.endsWith(":") && !text.endsWith("::")) text = text.slice(0, -1);
  }
  const words = (part: string) =>
    part
      .split(":")
      .filter(Boolean)
      .map((word) => parseInt(word, 16));
  const [head, rest] = text.split("::") as [string, string | undefined];
  if (rest === undefined) return [...words(head), ...tail];
  const before = words(head);
  const after = words(rest);
  const fill = 8 - before.length - after.length - tail.length;
  return [...before, ...new Array(fill).fill(0), ...after, ...tail];
}

/**
 * The IPv4 address an IPv6 address carries: IPv4-mapped (`::ffff:a9fe:a9fe`), IPv4-compatible
 * (`::a9fe:a9fe`) or NAT64 (`64:ff9b::a9fe:a9fe`). They reach the IPv4 address, so they are
 * judged as it is.
 */
function embeddedIPv4(words: number[]): string | undefined {
  const zero = (from: number, to: number) => words.slice(from, to).every((word) => word === 0);
  const v4 = () => [words[6]! >> 8, words[6]! & 255, words[7]! >> 8, words[7]! & 255].join(".");
  if (zero(0, 5) && words[5] === 0xffff) return v4();
  if (zero(0, 6) && (words[6] !== 0 || words[7]! > 1)) return v4();
  if (words[0] === 0x64 && words[1] === 0xff9b && zero(2, 6)) return v4();
  return undefined;
}

/** Whether an address serves cloud instance metadata, which holds credentials. */
export function isMetadataAddress(address: string): boolean {
  const words = ipv6Words(address);
  if (words) {
    const v4 = embeddedIPv4(words);
    if (v4) return isMetadataAddress(v4);
    // fd00:ec2::254 (AWS)
    return words.join(":") === [0xfd00, 0xec2, 0, 0, 0, 0, 0, 0x254].join(":");
  }
  if (isIP(address) !== 4) return false;
  return (
    address.startsWith("169.254.") || // AWS, Azure, GCP, DigitalOcean, OpenStack; Oracle too
    address === "192.0.0.192" || // Oracle Cloud
    address === "100.100.100.200" // Alibaba Cloud
  );
}

/** Whether an IP address is loopback, private, link-local, shared or otherwise not public. */
export function isPrivateAddress(address: string): boolean {
  const words = ipv6Words(address);
  if (words) {
    const v4 = embeddedIPv4(words);
    if (v4) return isPrivateAddress(v4);
    const first = words[0]!;
    return (
      words.every((word) => word === 0) || // ::
      (words.slice(0, 7).every((word) => word === 0) && words[7] === 1) || // ::1
      (first & 0xfe00) === 0xfc00 || // fc00::/7 unique local
      (first & 0xffc0) === 0xfe80 || // fe80::/10 link-local
      (first & 0xffc0) === 0xfec0 || // fec0::/10 site-local
      (first & 0xff00) === 0xff00 // ff00::/8 multicast
    );
  }
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number) as [number, number];
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
  return true;
}

function checkAddress(address: string, host: string, rules: FileSecurity): void {
  if (isMetadataAddress(address)) {
    throw new FileAccessError(`Refused to fetch from ${host}: it serves cloud instance metadata.`);
  }
  if (rules.blockPrivateNetwork && isPrivateAddress(address)) {
    throw new FileAccessError(`Refused to fetch from ${host}: it is a private address.`);
  }
}

// ---------------------------------------------------------------------------------------------
// Remote files

const METADATA_HOSTS = new Set(["metadata.google.internal", "metadata", "instance-data"]);

/** Checks a URL's scheme and host, and the host itself when it is an IP address. */
function checkUrlHost(url: string, rules: FileSecurity): URL {
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
  if (isIP(host)) checkAddress(host, host, rules);
  return parsed;
}

/**
 * Checks one URL against the rules, resolving its host. Used where the connection itself can't
 * be checked, because the app sends requests through its own fetch (a mock, a recorder or a
 * proxy): a host that can't be resolved here is let through, since the mock or proxy may be the
 * only one that can resolve it.
 */
export async function checkRemoteUrl(url: string, rules: FileSecurity = {}): Promise<void> {
  const parsed = checkUrlHost(url, rules);
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host)) return;
  let addresses: LookupAddress[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    return;
  }
  for (const { address } of addresses) checkAddress(address, host, rules);
}

const nativeFetch = globalThis.fetch;
const GLOBAL_DISPATCHER = Symbol.for("undici.globalDispatcher.1");

/**
 * Whether the app has taken over fetch: replaced it (a test mock, a recorder) or set its own
 * dispatcher (a proxy). Remote files then go through fetch, so they keep working as before.
 */
function appControlsFetch(): boolean {
  if (globalThis.fetch !== nativeFetch) return true;
  const dispatcher = (globalThis as Record<symbol, unknown>)[GLOBAL_DISPATCHER];
  return Boolean(dispatcher) && (dispatcher as object).constructor?.name !== "Agent";
}

type LookupCallback = (
  error: Error | null,
  address: string | LookupAddress[],
  family?: number
) => void;

/**
 * A DNS lookup for http/https requests or fetch's connections that checks every address a
 * connection may use before it connects, so a host can't pass a check with one address and
 * connect to another (DNS rebinding). A refused address fails the lookup with the error
 * `toError` makes, by default a FileAccessError.
 */
export function checkedLookupFor(
  rules: FileSecurity,
  label?: string,
  toError: (refused: FileAccessError) => Error = (refused) => refused
) {
  return (hostname: string, options: { all?: boolean }, callback: LookupCallback) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error) return callback(error, "");
      try {
        for (const { address } of addresses) checkAddress(address, label ?? hostname, rules);
      } catch (refused) {
        return callback(
          refused instanceof FileAccessError ? toError(refused) : (refused as Error),
          ""
        );
      }
      if (options?.all) return callback(null, addresses);
      const first = addresses[0]!;
      callback(null, first.address, first.family);
    });
  };
}

/** Checks a URL's scheme and host, without resolving it: metadata hosts and IP literals. */
export function checkUrlHostOnly(url: string, rules: FileSecurity = {}): URL {
  return checkUrlHost(url, rules);
}

/** Whether the app has replaced fetch or set its own dispatcher; see fetchChecked. */
export function fetchIsAppControlled(): boolean {
  return appControlsFetch();
}

/**
 * Fetches a URL, checking it and every redirect it follows against the rules, so a public URL
 * can't redirect to a metadata or private address. The address is checked in the connection's
 * own DNS lookup, so a host can't pass the check with one address and connect to another (DNS
 * rebinding). The body is read up to `maxBytes`; a larger one throws.
 */
export async function fetchChecked(
  url: string,
  rules: FileSecurity = {},
  maxBytes = MAX_REMOTE_BYTES
): Promise<Response> {
  const timeout = rules.fetchTimeout ?? DEFAULT_FETCH_TIMEOUT;
  const viaFetch = appControlsFetch();
  const signal = AbortSignal.timeout(timeout);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = viaFetch
      ? await fetchHop(current, rules, signal)
      : await requestHop(current, rules, signal, maxBytes);
    const location = headerOf(response, "location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel?.().catch(() => undefined);
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw new Error(`Too many redirects fetching ${url}.`);
}

async function fetchHop(url: string, rules: FileSecurity, signal: AbortSignal): Promise<Response> {
  await checkRemoteUrl(url, rules);
  return fetch(url, { redirect: "manual", signal });
}

function requestHop(
  url: string,
  rules: FileSecurity,
  signal: AbortSignal,
  maxBytes: number
): Promise<Response> {
  const parsed = checkUrlHost(url, rules);
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const client = parsed.protocol === "https:" ? https : http;
  const checkedLookup = checkedLookupFor(rules, host);

  return new Promise<Response>((resolve, reject) => {
    const request = client.request(
      parsed,
      { method: "GET", lookup: checkedLookup as never, signal, headers: { accept: "*/*" } },
      (incoming) => {
        const status = incoming.statusCode ?? 0;
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (value === undefined) continue;
          for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item);
        }
        if (status >= 300 && status < 400) {
          incoming.resume();
          return resolve(new Response(null, { status, headers }));
        }
        const declared = Number(headers.get("content-length"));
        if (Number.isFinite(declared) && declared > maxBytes) {
          incoming.destroy();
          return reject(
            new Error(
              `Remote file ${url} is ${declared} bytes, exceeding the ${maxBytes}-byte limit.`
            )
          );
        }
        const chunks: Buffer[] = [];
        let total = 0;
        incoming.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            incoming.destroy();
            reject(new Error(`Remote file ${url} is over ${maxBytes} bytes, exceeding the limit.`));
            return;
          }
          chunks.push(chunk);
        });
        incoming.on("end", () =>
          resolve(new Response(status === 204 ? null : Buffer.concat(chunks), { status, headers }))
        );
        incoming.on("error", reject);
      }
    );
    request.on("error", reject);
    request.end();
  });
}

/**
 * Fetches a remote file after checking it against the rules and reads its bytes, up to
 * `maxBytes`. A response that isn't OK is returned without bytes, for the caller to report.
 */
export async function readRemoteChecked(
  url: string,
  rules?: FileSecurity,
  maxBytes = MAX_REMOTE_BYTES
): Promise<{ response: Response; bytes?: ArrayBuffer }> {
  const response = await fetchChecked(url, rules, maxBytes);
  if (!response.ok) {
    await response.body?.cancel?.().catch(() => undefined);
    return { response };
  }
  return { response, bytes: await readCapped(response, url, maxBytes) };
}

/** Reads a response body, stopping once it passes `maxBytes`. */
export async function readCapped(
  response: Response,
  source: string,
  maxBytes = MAX_REMOTE_BYTES
): Promise<ArrayBuffer> {
  const declared = Number(headerOf(response, "content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(
      `Remote file ${source} is ${declared} bytes, exceeding the ${maxBytes}-byte limit.`
    );
  }
  const body = response.body as ReadableStream<Uint8Array> | null;
  if (!body || typeof body.getReader !== "function") {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new Error(
        `Remote file ${source} is ${buffer.byteLength} bytes, exceeding the ${maxBytes}-byte limit.`
      );
    }
    return buffer;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Remote file ${source} is over ${maxBytes} bytes, exceeding the limit.`);
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer.buffer;
}
