export type BodyInit =
  | ReadableStream
  | Blob
  | ArrayBuffer
  | FormData
  | string
  | null;
export type RequestInfo = string | Request;

export type RouteParams = Record<string, string>;

export type Span = import("@opentelemetry/api").Span;

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
