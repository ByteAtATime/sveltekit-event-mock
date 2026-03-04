import { describe, test, expect } from "bun:test";
import {
  mock,
  MockCookies,
  MockSpan,
  type RouteParamsFromRoute,
} from "./index";

describe("MockCookies", () => {
  test("should get and set cookies", () => {
    const cookies = new MockCookies();
    cookies.set("session", "abc123", { path: "/" });

    expect(cookies.get("session")).toBe("abc123");
  });

  test("should return undefined for non-existent cookie", () => {
    const cookies = new MockCookies();
    expect(cookies.get("nonexistent")).toBeUndefined();
  });

  test("should delete cookies", () => {
    const cookies = new MockCookies();
    cookies.set("session", "abc123", { path: "/" });
    expect(cookies.get("session")).toBe("abc123");

    cookies.delete("session", { path: "/" });
    expect(cookies.get("session")).toBeUndefined();
  });

  test("should get all cookies", () => {
    const cookies = new MockCookies();
    cookies.set("session", "abc123", { path: "/" });
    cookies.set("user", "john", { path: "/" });

    const all = cookies.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContainEqual({ name: "session", value: "abc123" });
    expect(all).toContainEqual({ name: "user", value: "john" });
  });

  test("should serialize cookies", () => {
    const cookies = new MockCookies();
    const serialized = cookies.serialize("session", "abc123", {
      path: "/",
      httpOnly: true,
      secure: true,
    });

    expect(serialized).toContain("session=abc123");
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("HttpOnly");
    expect(serialized).toContain("Secure");
  });
});

describe("MockSpan", () => {
  test("should set attributes", () => {
    const span = new MockSpan();
    span.attribute("key1", "value1");
    span.attribute("key2", 123);

    const attrs = span.__getAttributes();
    expect(attrs.get("key1")).toBe("value1");
    expect(attrs.get("key2")).toBe(123);
  });

  test("should return self for chaining", () => {
    const span = new MockSpan();
    const result = span.attribute("key", "value");
    expect(result).toBe(span);
  });

  test("should end without error", () => {
    const span = new MockSpan();
    expect(() => span.end()).not.toThrow();
  });
});

describe("mock builder", () => {
  test("should create event with fluent builder", () => {
    const event = mock
      .post("/api/items")
      .json({ name: "test" })
      .withHeader("x-api-key", "abc")
      .withCookie("session", "abc123")
      .withLocals({ user: { id: 1 } } as App.Locals)
      .withParam("id", "123");

    expect(event.request.method).toBe("POST");
    expect(event.request.headers.get("Content-Type")).toBe("application/json");
    expect(event.request.headers.get("x-api-key")).toBe("abc");
    expect(event.cookies.get("session")).toBe("abc123");
    expect(event.locals).toEqual({ user: { id: 1 } });
    expect(event.params).toEqual({ id: "123" });
  });

  test("should support method chaining", () => {
    const event = mock.get("/api/items");
    expect(event.request.method).toBe("GET");
  });

  test("should support fromUrl factory", () => {
    const event = mock.fromUrl("/api/items");
    expect(event.url.pathname).toBe("/api/items");
  });

  test("should support text body", () => {
    const event = mock.post("/api/items").text("plain text");
    expect(event.request.headers.get("Content-Type")).toBe("text/plain");
  });

  test("should support form data", () => {
    const event = mock.post("/api/items").form({ name: "test" });
    expect(event.request.body).toBeInstanceOf(ReadableStream);
  });

  test("should support platform", () => {
    const platform = { env: { API_KEY: "abc" } };
    const event = mock.get("/api/items").withPlatform(platform);
    expect(event.platform).toEqual(platform);
  });

  test("should support tracing", () => {
    const span = new MockSpan();
    const tracing = { enabled: true, root: span, current: span };
    const event = mock.get("/api/items").withTracing(tracing);
    expect(event.tracing.enabled).toBe(true);
  });

  test("should support custom fetch", async () => {
    const customFetch = async () => new Response("mocked");
    const event = mock.get("/api/items").withFetch(customFetch as any);
    const response = await event.fetch("/test");
    const text = await response.text();
    expect(text).toBe("mocked");
  });
});

describe("RouteParamsFromRoute type", () => {
  test("should extract single param", () => {
    type Params = RouteParamsFromRoute<"/api/items/[id]">;
    const params: Params = { id: "123" };
    expect(params.id).toBe("123");
  });

  test("should extract multiple params", () => {
    type Params = RouteParamsFromRoute<"/api/items/[id]/comments/[commentId]">;
    const params: Params = { id: "123", commentId: "456" };
    expect(params.id).toBe("123");
    expect(params.commentId).toBe("456");
  });

  test("should return empty type for route without params", () => {
    type Params = RouteParamsFromRoute<"/api/items">;
    const params: Params = {};
    expect(Object.keys(params)).toHaveLength(0);
  });
});

describe("Integration tests", () => {
  test("should handle complex event creation", () => {
    const event = mock
      .get("/api/users/[userId]/posts/[postId]")
      .withHeaders({
        Authorization: "Bearer token",
        "X-Custom-Header": "value",
      })
      .withCookies({
        session: "abc123",
        pref: "dark",
      })
      .withParam("userId", "123")
      .withParam("postId", "456")
      .withLocals({
        user: { id: 123, role: "admin" },
      } as App.Locals)
      .withIsDataRequest(true)
      .withRoute("/api/users/[userId]/posts/[postId]");

    expect(event.request.method).toBe("GET");
    expect(event.request.headers.get("Authorization")).toBe("Bearer token");
    expect(event.cookies.get("session")).toBe("abc123");
    expect(event.params.userId).toBe("123");
    expect(event.params.postId).toBe("456");
    expect((event.locals as any).user.role).toBe("admin");
    expect(event.isDataRequest).toBe(true);
    expect(event.route.id).toBe("/api/users/[userId]/posts/[postId]");
  });

  test("should handle fetch with relative URLs", async () => {
    const mockFetch = async () => new Response("mocked response");
    const event = mock.get("/api/base").withFetch(mockFetch as any);
    const response = await event.fetch("/api/relative");
    expect(response).toBeDefined();
  });

  test("should support setHeaders tracking", () => {
    const event = mock.get("/api/items");
    event.setHeaders({ "X-Custom": "value" });
    expect(() => event.setHeaders({ "X-Another": "value" })).not.toThrow();
  });
});
