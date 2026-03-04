import type { Cookies, RequestEvent } from "@sveltejs/kit";
import type { CookieParseOptions, CookieSerializeOptions } from "cookie";

type BodyInit = ReadableStream | Blob | ArrayBuffer | FormData | string | null;
type RequestInfo = string | Request;

export type RouteParams = Record<string, string>;

export type Span = {
  attribute(key: string, value: unknown): Span;
  end(): void;
};

export type Tracing = {
  enabled: boolean;
  root: Span;
  current: Span;
};

export type RouteParamsFromRoute<T extends string> =
  T extends `${infer _Start}[${infer Param}]${infer Rest}`
    ? { [K in Param | keyof RouteParamsFromRoute<Rest>]: string }
    : T extends `${infer _Start}[${infer Param}]`
      ? { [K in Param]: string }
      : {};

export class MockCookies implements Cookies {
  private store = new Map<string, string>();

  get(name: string, opts?: CookieParseOptions): string | undefined {
    const value = this.store.get(name);
    if (!value) return undefined;

    if (opts?.decode) {
      try {
        return opts.decode(value);
      } catch (err) {
        if (
          typeof process !== "undefined" &&
          process.env?.NODE_ENV !== "production"
        ) {
          console.warn(`Failed to decode cookie "${name}":`, err);
        }
        return value;
      }
    }

    try {
      return decodeURIComponent(value);
    } catch (err) {
      if (
        typeof process !== "undefined" &&
        process.env?.NODE_ENV !== "production"
      ) {
        console.warn(`Failed to decode cookie "${name}":`, err);
      }
      return value;
    }
  }

  set(
    name: string,
    value: string,
    opts: CookieSerializeOptions & { path: string },
  ): void {
    this.store.set(name, value);
  }

  delete(name: string, opts: CookieSerializeOptions & { path: string }): void {
    this.store.delete(name);
  }

  serialize(
    name: string,
    value: string,
    opts: CookieSerializeOptions & { path: string },
  ): string {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.path !== undefined) {
      cookie += `; Path=${opts.path}`;
    }
    if (opts.domain) {
      cookie += `; Domain=${opts.domain}`;
    }
    if (opts.maxAge !== undefined) {
      cookie += `; Max-Age=${opts.maxAge}`;
    }
    if (opts.expires) {
      cookie += `; Expires=${opts.expires.toUTCString()}`;
    }
    if (opts.httpOnly) {
      cookie += `; HttpOnly`;
    }
    if (opts.secure) {
      cookie += `; Secure`;
    }
    if (opts.sameSite !== undefined) {
      const allowedSameSiteValues = ["strict", "lax", "none", true, false];
      const isValid = allowedSameSiteValues.includes(opts.sameSite);
      if (!isValid) {
        throw new Error(
          `Invalid sameSite value: ${String(opts.sameSite)}. Must be one of: ${allowedSameSiteValues.map((v) => JSON.stringify(v)).join(", ")}`,
        );
      }

      let sameSite: string;
      if (typeof opts.sameSite === "boolean") {
        sameSite = opts.sameSite ? "Strict" : "Lax";
      } else {
        sameSite =
          opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1);
      }
      cookie += `; SameSite=${sameSite}`;
    }
    if (opts.priority) {
      const allowedPriorityValues = ["low", "medium", "high"];
      if (!allowedPriorityValues.includes(opts.priority)) {
        throw new Error(
          `Invalid priority value: ${opts.priority}. Must be one of: ${allowedPriorityValues.join(", ")}`,
        );
      }
      cookie += `; Priority=${opts.priority.charAt(0).toUpperCase() + opts.priority.slice(1)}`;
    }
    if (opts.partitioned) {
      cookie += `; Partitioned`;
    }

    return cookie;
  }

  getAll(opts?: CookieParseOptions): Array<{ name: string; value: string }> {
    const entries = Array.from(this.store.entries());

    if (opts?.decode) {
      return entries.map(([name, value]) => {
        try {
          return { name, value: opts.decode!(value) };
        } catch (err) {
          if (
            typeof process !== "undefined" &&
            process.env?.NODE_ENV !== "production"
          ) {
            console.warn(`Failed to decode cookie "${name}":`, err);
          }
          return { name, value };
        }
      });
    }

    return entries.map(([name, value]) => {
      try {
        return { name, value: decodeURIComponent(value) };
      } catch (err) {
        if (
          typeof process !== "undefined" &&
          process.env?.NODE_ENV !== "production"
        ) {
          console.warn(`Failed to decode cookie "${name}":`, err);
        }
        return { name, value };
      }
    });
  }

  __getStore(): Map<string, string> {
    return this.store;
  }
}

export class MockSpan implements Span {
  private attributes = new Map<string, unknown>();

  attribute(key: string, value: unknown): Span {
    this.attributes.set(key, value);
    return this;
  }

  end(): void {}

  __getAttributes(): Map<string, unknown> {
    return this.attributes;
  }
}

export type MockRequestEventBuilder<
  Params extends RouteParams = RouteParams,
  RouteId extends string | null = string | null,
> = MockRequestEventBuilderBase<Params, RouteId> &
  RequestEvent<Params, RouteId>;

export class MockRequestEventBuilderBase<
  Params extends RouteParams = RouteParams,
  RouteId extends string | null = string | null,
> {
  private _method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS" = "GET";
  private _url: URL | null = null;
  private _body: BodyInit | null = null;
  private _headers = new Headers();
  private _cookies = new MockCookies();
  private _locals: Record<string, unknown> = {};
  private _params: RouteParams = {};
  private _platform: App.Platform | undefined;
  private _route: RouteId = null as RouteId;
  private _isDataRequest = false;
  private _isSubRequest = false;
  private _isRemoteRequest = false;
  private _clientAddress = "127.0.0.1";
  private _fetchFn: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response> = globalThis.fetch;
  private _setHeadersStore = new Headers();
  private _tracing: Tracing = {
    enabled: false,
    root: new MockSpan(),
    current: new MockSpan(),
  };

  static fromUrl(url: string): MockRequestEventBuilder {
    return new MockRequestEventBuilderBase().withUrl(
      url,
    ) as MockRequestEventBuilder;
  }

  method(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS",
  ): MockRequestEventBuilder<Params, RouteId> {
    this._method = method;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  get(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("GET").withUrl(url);
  }

  post(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("POST").withUrl(url);
  }

  put(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("PUT").withUrl(url);
  }

  delete(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("DELETE").withUrl(url);
  }

  patch(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("PATCH").withUrl(url);
  }

  head(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("HEAD").withUrl(url);
  }

  options(url: string): MockRequestEventBuilder<Params, RouteId> {
    return this.method("OPTIONS").withUrl(url);
  }

  withUrl(urlString: string): MockRequestEventBuilder<Params, RouteId> {
    this._url = new URL(urlString, "http://localhost");
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  json(body: unknown): MockRequestEventBuilder<Params, RouteId> {
    this._body = JSON.stringify(body);
    this._headers.set("Content-Type", "application/json");
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  text(body: string): MockRequestEventBuilder<Params, RouteId> {
    this._body = body;
    this._headers.set("Content-Type", "text/plain");
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  form(
    data: Record<string, string | File>,
  ): MockRequestEventBuilder<Params, RouteId> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    this._body = formData;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withHeader(
    name: string,
    value: string,
  ): MockRequestEventBuilder<Params, RouteId> {
    this._headers.set(name, value);
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withHeaders(
    headers: Record<string, string>,
  ): MockRequestEventBuilder<Params, RouteId> {
    for (const [name, value] of Object.entries(headers)) {
      this._headers.set(name, value);
    }
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withCookie(
    name: string,
    value: string,
    opts?: CookieSerializeOptions & { path: string },
  ): MockRequestEventBuilder<Params, RouteId> {
    this._cookies.set(name, value, opts || { path: "/" });
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withCookies(
    jar: Record<string, string> | ((jar: MockCookies) => void),
  ): MockRequestEventBuilder<Params, RouteId> {
    if (typeof jar === "function") {
      jar(this._cookies);
    } else {
      for (const [name, value] of Object.entries(jar)) {
        this._cookies.set(name, value, { path: "/" });
      }
    }
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withLocals(locals: App.Locals): MockRequestEventBuilder<Params, RouteId> {
    this._locals = { ...this._locals, ...locals };
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withParams(params: RouteParams): MockRequestEventBuilder<Params, RouteId> {
    this._params = { ...this._params, ...params };
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withParam(
    key: string,
    value: string,
  ): MockRequestEventBuilder<Params, RouteId> {
    if (
      key === "" ||
      key.includes("/") ||
      key.includes("?") ||
      key.includes("#")
    ) {
      throw new Error(
        `Invalid parameter key: "${key}". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.`,
      );
    }
    if (value === "") {
      throw new Error(
        `Invalid parameter value for key "${key}": values must be non-empty.`,
      );
    }
    this._params[key] = value;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withPlatform(
    platform: App.Platform,
  ): MockRequestEventBuilder<Params, RouteId> {
    this._platform = platform;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withRoute(routeId: string): MockRequestEventBuilder<Params, RouteId> {
    this._route = routeId as RouteId;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withSetHeaders(
    headers: Record<string, string>,
  ): MockRequestEventBuilder<Params, RouteId> {
    for (const [name, value] of Object.entries(headers)) {
      this._setHeadersStore.set(name, value);
    }
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withIsDataRequest(value: boolean): MockRequestEventBuilder<Params, RouteId> {
    this._isDataRequest = value;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withIsSubRequest(value: boolean): MockRequestEventBuilder<Params, RouteId> {
    this._isSubRequest = value;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withIsRemoteRequest(
    value: boolean,
  ): MockRequestEventBuilder<Params, RouteId> {
    this._isRemoteRequest = value;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  clientAddress(address: string): MockRequestEventBuilder<Params, RouteId> {
    this._clientAddress = address;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withFetch(
    fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  ): MockRequestEventBuilder<Params, RouteId> {
    this._fetchFn = fn;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  withTracing(tracing: Tracing): MockRequestEventBuilder<Params, RouteId> {
    this._tracing = tracing;
    return this as MockRequestEventBuilder<Params, RouteId>;
  }

  get request(): Request {
    const effectiveUrl = this._url || new URL("http://localhost");
    return new Request(effectiveUrl.href, {
      method: this._method,
      headers: this._headers,
      body: this._body,
    });
  }

  get url(): URL {
    return this._url || new URL("http://localhost");
  }

  get params(): Params {
    return this._params as Params;
  }

  get route(): { id: RouteId } {
    return { id: this._route };
  }

  get cookies(): Cookies {
    return this._cookies;
  }

  get locals(): App.Locals {
    return this._locals as App.Locals;
  }

  get platform(): App.Platform | undefined {
    return this._platform;
  }

  get isDataRequest(): boolean {
    return this._isDataRequest;
  }

  get isSubRequest(): boolean {
    return this._isSubRequest;
  }

  get isRemoteRequest(): boolean {
    return this._isRemoteRequest;
  }

  get fetch(): typeof fetch {
    const effectiveUrl = this._url || new URL("http://localhost");
    const mockFetch: (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response> = (input, init) => {
      const url =
        typeof input === "string" ? new URL(input, effectiveUrl) : input;
      return this._fetchFn(url, init);
    };
    return mockFetch as typeof fetch;
  }

  get getClientAddress(): () => string {
    return () => this._clientAddress;
  }

  get setHeaders(): (headers: Record<string, string>) => void {
    const setHeadersStore = this._setHeadersStore;
    return (headers: Record<string, string>) => {
      for (const [name, value] of Object.entries(headers)) {
        setHeadersStore.set(name, value);
      }
    };
  }

  get tracing(): Tracing {
    return this._tracing;
  }
}

export const mock = {
  builder: () => new MockRequestEventBuilderBase() as MockRequestEventBuilder,

  fromUrl: (url: string) => MockRequestEventBuilderBase.fromUrl(url),

  get: (url: string) =>
    new MockRequestEventBuilderBase().get(url) as MockRequestEventBuilder,
  post: (url: string) =>
    new MockRequestEventBuilderBase().post(url) as MockRequestEventBuilder,
  put: (url: string) =>
    new MockRequestEventBuilderBase().put(url) as MockRequestEventBuilder,
  delete: (url: string) =>
    new MockRequestEventBuilderBase().delete(url) as MockRequestEventBuilder,
  patch: (url: string) =>
    new MockRequestEventBuilderBase().patch(url) as MockRequestEventBuilder,
  head: (url: string) =>
    new MockRequestEventBuilderBase().head(url) as MockRequestEventBuilder,
  options: (url: string) =>
    new MockRequestEventBuilderBase().options(url) as MockRequestEventBuilder,
};

export type {
  RequestEvent,
  Cookies,
  CookieParseOptions,
  CookieSerializeOptions,
};
