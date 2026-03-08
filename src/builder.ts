import type { Cookies, RequestEvent } from "@sveltejs/kit";
import type { CookieSerializeOptions } from "cookie";
import type {
  BodyInit,
  RequestInfo,
  RouteParams,
  Span,
  Tracing,
} from "./types";
import { MockCookies } from "./cookies";
import { MockSpan } from "./span";
import { validateParamKey, validateParamValue } from "./validation";
import type { RouteId as KitRouteId, AppTypes } from "$app/types";

export type MockRequestEventBuilder<
  Params extends RouteParams = RouteParams,
  RouteId extends KitRouteId | null = KitRouteId | null,
> = MockRequestEventBuilderBase<Params, RouteId> &
  RequestEvent<Params, RouteId>;

export class MockRequestEventBuilderBase<
  Params extends RouteParams = RouteParams,
  RouteId extends KitRouteId | null = KitRouteId | null,
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
    validateParamKey(key);
    validateParamValue(key, value);
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
    return this._locals as unknown as App.Locals; // cast to unknown first because in a real app it throws a type error
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

    return ((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? new URL(input, effectiveUrl) : input;
      return this._fetchFn(url, init);
    }) as typeof fetch;
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
