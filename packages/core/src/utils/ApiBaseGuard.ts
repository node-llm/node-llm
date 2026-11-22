// Checks on requests to a custom base URL (any provider's apiBase), so a gateway that an app's
// admin or user can set can't steer NodeLLM to cloud metadata or, when asked, to private
// addresses. Requests to a provider's own default URL are not touched.
import { ApiBaseRefusedError } from "../errors/index.js";
import {
  checkedLookupFor,
  checkRemoteUrl,
  checkUrlHostOnly,
  FileAccessError,
  fetchIsAppControlled,
  type FileSecurity
} from "./FileSecurity.js";

/** Rules for requests to a custom base URL (a provider's `apiBase`). */
export interface ApiBaseSecurity {
  /**
   * Refuse a base URL whose host is, or resolves to, a private, loopback, link-local or shared
   * address, checked on every connection, so a public name can't later point inside (DNS
   * rebinding). Off by default, since local models and company gateways often live there; turn
   * it on when users or admins can set a base URL. Cloud metadata addresses are refused even
   * without it.
   */
  blockPrivateNetwork?: boolean;
}

const MAX_REDIRECTS = 5;

/** Custom base URLs set in config, each with the strictest rules any config gave it. */
const customBases = new Map<string, ApiBaseSecurity>();

/** Remembers a custom base URL, so requests to it are checked. Called by checkApiBase. */
export function registerCustomApiBase(base: string, rules: ApiBaseSecurity = {}): void {
  const key = base.replace(/\/+$/, "");
  const known = customBases.get(key);
  customBases.set(key, {
    blockPrivateNetwork: Boolean(known?.blockPrivateNetwork || rules.blockPrivateNetwork)
  });
}

/** The rules for a request URL when it goes to a custom base URL, or undefined. */
export function apiBaseRulesFor(url: string): ApiBaseSecurity | undefined {
  for (const [base, rules] of customBases) {
    if (url === base || url.startsWith(base + "/") || url.startsWith(base + "?")) return rules;
  }
  return undefined;
}

/** Forgets the custom base URLs; for tests. */
export function clearCustomApiBases(): void {
  customBases.clear();
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function refused(error: FileAccessError, url: string): ApiBaseRefusedError {
  return new ApiBaseRefusedError(
    error.message.replace("Refused to fetch from", "Refused to call"),
    hostOf(url)
  );
}

type Dispatcher = object;
const GLOBAL_DISPATCHER = Symbol.for("undici.globalDispatcher.1");
const dispatchers = new Map<boolean, Dispatcher | null>();

/**
 * An undici Agent for Node's own fetch whose connections check the address they connect to.
 * Built from the class of fetch's global dispatcher, so no extra dependency is needed; null
 * where that isn't available (another runtime), and the host is then checked before the call.
 */
function checkedDispatcher(rules: ApiBaseSecurity): Dispatcher | null {
  const key = Boolean(rules.blockPrivateNetwork);
  if (dispatchers.has(key)) return dispatchers.get(key)!;
  let dispatcher: Dispatcher | null = null;
  const global = (globalThis as Record<symbol, unknown>)[GLOBAL_DISPATCHER] as
    | { constructor?: new (options: unknown) => Dispatcher }
    | undefined;
  const Agent = global?.constructor;
  if (Agent && Agent.name === "Agent") {
    try {
      dispatcher = new Agent({
        connect: {
          lookup: checkedLookupFor(
            toFileRules(rules),
            undefined,
            (error) =>
              new ApiBaseRefusedError(
                error.message.replace("Refused to fetch from", "Refused to call"),
                error.message.match(/from (\S+):/)?.[1]
              )
          )
        }
      });
    } catch {
      dispatcher = null;
    }
  }
  // fetch's global dispatcher may not exist before the first fetch; try again next time.
  if (global) dispatchers.set(key, dispatcher);
  return dispatcher;
}

function toFileRules(rules: ApiBaseSecurity): FileSecurity {
  return { blockPrivateNetwork: rules.blockPrivateNetwork };
}

/** The ApiBaseRefusedError a fetch failed with, when a connection's address was refused. */
function refusedCause(error: unknown): ApiBaseRefusedError | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    if (current instanceof ApiBaseRefusedError) return current;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** The method and body a redirect is followed with, as fetch itself would. */
function redirected(status: number, init: RequestInit): RequestInit {
  const method = (init.method ?? "GET").toUpperCase();
  if (status === 303 || ((status === 301 || status === 302) && method === "POST")) {
    const headers = new Headers(init.headers);
    headers.delete("content-type");
    headers.delete("content-length");
    return { ...init, method: method === "HEAD" ? "HEAD" : "GET", body: undefined, headers };
  }
  return init;
}

/**
 * Fetch for a request to a custom base URL. The host is checked, and the address of every
 * connection is checked as it connects. Redirects are followed only within the same host; a
 * redirect elsewhere throws, so a gateway can't send the request on to an internal address.
 */
export async function fetchApiBase(
  url: string,
  init: RequestInit,
  rules: ApiBaseSecurity
): Promise<Response> {
  const fileRules = toFileRules(rules);
  const viaApp = fetchIsAppControlled();
  const dispatcher = viaApp ? null : checkedDispatcher(rules);
  const originalHost = hostOf(url).toLowerCase();
  let current = url;
  let options = init;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    try {
      checkUrlHostOnly(current, fileRules);
      if (!dispatcher) await checkRemoteUrl(current, fileRules);
    } catch (error) {
      if (error instanceof FileAccessError) throw refused(error, current);
      throw error;
    }

    const request: RequestInit & { dispatcher?: Dispatcher } = { ...options, redirect: "manual" };
    if (dispatcher) request.dispatcher = dispatcher;
    let response: Response;
    try {
      response = await fetch(current, request);
    } catch (error) {
      const cause = refusedCause(error);
      if (cause) throw cause;
      throw error;
    }

    const location = response.headers?.get?.("location");
    if (response.status < 300 || response.status >= 400 || !location) return response;

    await response.body?.cancel?.().catch(() => undefined);
    const next = new URL(location, current).toString();
    const nextHost = hostOf(next).toLowerCase();
    if (nextHost !== originalHost) {
      throw new ApiBaseRefusedError(
        `Refused to follow a redirect from ${originalHost} to ${nextHost}: a custom base URL ` +
          `may only redirect within its own host. Set the base URL to the final address instead.`,
        nextHost
      );
    }
    current = next;
    options = redirected(response.status, options);
  }
  throw new ApiBaseRefusedError(`Too many redirects calling ${originalHost}.`, originalHost);
}
