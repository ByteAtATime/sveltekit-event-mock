export type {
  BodyInit,
  RequestInfo,
  RouteParams,
  RouteParamsFromRoute,
  Span,
  Tracing,
} from "./types";

export { MockSpan } from "./span";

export { MockCookies } from "./cookies";

export {
  MockRequestEventBuilderBase,
  type MockRequestEventBuilder,
} from "./builder";

import { MockRequestEventBuilderBase, type MockRequestEventBuilder } from "./builder";

export const mock = {
  builder: () =>
    new MockRequestEventBuilderBase() as MockRequestEventBuilder,

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
} from "@sveltejs/kit";

export type {
  CookieParseOptions,
  CookieSerializeOptions,
} from "cookie";
