import { describe, test, expect } from "bun:test";
import { mock, MockSpan } from "./index";

describe("RequestEvent Builder - URL and Method", () => {
  describe("withUrl", () => {
    test("it should correctly parse URL from path string", () => {
      const event = mock.get("/api/items");
      expect(event.url.pathname).toBe("/api/items");
    });

    test("it should correctly parse URL with query parameters", () => {
      const event = mock.get("/api/items?page=1&limit=10");
      expect(event.url.pathname).toBe("/api/items");
      expect(event.url.searchParams.get("page")).toBe("1");
      expect(event.url.searchParams.get("limit")).toBe("10");
    });

    test("it should correctly parse URL with hash fragment", () => {
      const event = mock.get("/api/items#section");
      expect(event.url.pathname).toBe("/api/items");
      expect(event.url.hash).toBe("#section");
    });

    test("it should correctly parse URL with protocol-relative path", () => {
      const event = mock.fromUrl("/api/test");
      expect(event.url.hostname).toBe("localhost");
    });

    test("it should use default localhost when URL is not fully qualified", () => {
      const event = mock.get("/test");
      expect(event.url.origin).toBe("http://localhost");
    });
  });

  describe("HTTP Methods", () => {
    test("it should correctly create GET request", () => {
      const event = mock.get("/api/items");
      expect(event.request.method).toBe("GET");
    });

    test("it should correctly create POST request", () => {
      const event = mock.post("/api/items");
      expect(event.request.method).toBe("POST");
    });

    test("it should correctly create PUT request", () => {
      const event = mock.put("/api/items");
      expect(event.request.method).toBe("PUT");
    });

    test("it should correctly create PATCH request", () => {
      const event = mock.patch("/api/items");
      expect(event.request.method).toBe("PATCH");
    });

    test("it should correctly create DELETE request", () => {
      const event = mock.delete("/api/items");
      expect(event.request.method).toBe("DELETE");
    });

    test("it should correctly create HEAD request", () => {
      const event = mock.head("/api/items");
      expect(event.request.method).toBe("HEAD");
    });

    test("it should correctly create OPTIONS request", () => {
      const event = mock.options("/api/items");
      expect(event.request.method).toBe("OPTIONS");
    });
  });
});

describe("RequestEvent Builder - Request Body", () => {
  describe("json", () => {
    test("it should correctly set JSON body with proper Content-Type header", async () => {
      const event = mock.post("/api/items").json({ name: "test" });

      expect(event.request.headers.get("content-type")).toBe(
        "application/json",
      );

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      expect(body).toBe(JSON.stringify({ name: "test" }));
    });

    test("it should correctly serialize nested objects", async () => {
      const event = mock.post("/api/items").json({
        user: { name: "John", age: 30 },
        tags: ["a", "b", "c"],
      });

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      const parsed = JSON.parse(body);
      expect(parsed).toEqual({
        user: { name: "John", age: 30 },
        tags: ["a", "b", "c"],
      });
    });

    test("it should correctly serialize arrays", async () => {
      const event = mock.post("/api/items").json([1, 2, 3]);

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      expect(JSON.parse(body)).toEqual([1, 2, 3]);
    });

    test("it should correctly serialize null and undefined values", async () => {
      const event = mock.post("/api/items").json({
        name: "test",
        value: null,
        optional: undefined,
      });

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      const parsed = JSON.parse(body);
      expect(parsed.name).toBe("test");
      expect(parsed.value).toBe(null);
      expect(parsed.optional).toBeUndefined();
    });
  });

  describe("text", () => {
    test("it should correctly set plain text body with proper Content-Type header", async () => {
      const event = mock.post("/api/items").text("plain text");

      expect(event.request.headers.get("content-type")).toBe("text/plain");

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      expect(body).toBe("plain text");
    });

    test("it should correctly set text with special characters", async () => {
      const event = mock.post("/api/items").text("Hello, 世界! 🌍");

      const clonedRequest = event.request.clone();
      const body = await clonedRequest.text();
      expect(body).toBe("Hello, 世界! 🌍");
    });
  });

  describe("form", () => {
    test("it should correctly set form data body", async () => {
      const event = mock.post("/api/items").form({ name: "test", count: "42" });

      expect(event.request.body).toBeInstanceOf(ReadableStream);

      const formData = await event.request.formData();
      expect(formData.get("name")).toBe("test");
      expect(formData.get("count")).toBe("42");
    });

    test("it should correctly handle form data with multiple fields", async () => {
      const event = mock.post("/api/items").form({
        username: "john",
        email: "john@example.com",
        age: "30",
      });

      const formData = await event.request.formData();
      expect(formData.get("username")).toBe("john");
      expect(formData.get("email")).toBe("john@example.com");
      expect(formData.get("age")).toBe("30");
    });
  });
});

describe("RequestEvent Builder - Headers", () => {
  describe("withHeader", () => {
    test("it should correctly set a single header", () => {
      const event = mock.get("/api/items").withHeader("x-api-key", "abc123");
      expect(event.request.headers.get("x-api-key")).toBe("abc123");
    });

    test("it should handle headers with special characters", () => {
      const event = mock
        .get("/api/items")
        .withHeader("x-custom", "value:with;special=chars");
      expect(event.request.headers.get("x-custom")).toBe(
        "value:with;special=chars",
      );
    });

    test("it should correctly override header when set multiple times", () => {
      const event = mock
        .get("/api/items")
        .withHeader("x-api-key", "first")
        .withHeader("x-api-key", "second");
      expect(event.request.headers.get("x-api-key")).toBe("second");
    });
  });

  describe("withHeaders", () => {
    test("it should correctly set multiple headers at once", () => {
      const event = mock.get("/api/items").withHeaders({
        "x-api-key": "abc123",
        Authorization: "Bearer token",
        "X-Custom-Header": "value",
      });

      expect(event.request.headers.get("x-api-key")).toBe("abc123");
      expect(event.request.headers.get("authorization")).toBe("Bearer token");
      expect(event.request.headers.get("x-custom-header")).toBe("value");
    });

    test("it should correctly handle empty headers object", () => {
      const event = mock.get("/api/items").withHeaders({});
      expect(() => event.request.headers).not.toThrow();
    });
  });
});

describe("RequestEvent Builder - Cookies", () => {
  describe("withCookie", () => {
    test("it should correctly set a single cookie", () => {
      const event = mock.get("/api/items").withCookie("session", "abc123");
      expect(event.cookies.get("session")).toBe("abc123");
    });

    test("it should correctly set cookie with options", () => {
      const event = mock.get("/api/items").withCookie("session", "abc123", {
        path: "/",
        httpOnly: true,
        secure: true,
      });
      expect(event.cookies.get("session")).toBe("abc123");
    });

    test("it should correctly override cookie when set multiple times", () => {
      const event = mock
        .get("/api/items")
        .withCookie("session", "first")
        .withCookie("session", "second");
      expect(event.cookies.get("session")).toBe("second");
    });
  });

  describe("withCookies", () => {
    test("it should correctly set multiple cookies from object", () => {
      const event = mock.get("/api/items").withCookies({
        session: "abc123",
        user: "john",
        theme: "dark",
      });

      expect(event.cookies.get("session")).toBe("abc123");
      expect(event.cookies.get("user")).toBe("john");
      expect(event.cookies.get("theme")).toBe("dark");
    });

    test("it should correctly set cookies using callback function", () => {
      const event = mock.get("/api/items").withCookies((cookies) => {
        cookies.set("session", "abc123", { path: "/" });
        cookies.set("user", "john", { path: "/" });
      });

      expect(event.cookies.get("session")).toBe("abc123");
      expect(event.cookies.get("user")).toBe("john");
    });

    test("it should correctly handle empty cookies object", () => {
      const event = mock.get("/api/items").withCookies({});
      expect(event.cookies.getAll()).toHaveLength(0);
    });
  });
});

describe("RequestEvent Builder - Params", () => {
  describe("withParam", () => {
    test("it should correctly set a single route parameter", () => {
      const event = mock.get("/api/items").withParam("id", "123");
      expect(event.params.id).toBe("123");
    });

    test("it should allow setting multiple params through chaining", () => {
      const event = mock
        .get("/api/items")
        .withParam("userId", "123")
        .withParam("postId", "456");
      expect(event.params.userId).toBe("123");
      expect(event.params.postId).toBe("456");
    });

    test("it should correctly handle unicode in param values", () => {
      const event = mock.get("/api/items").withParam("name", "José");
      expect(event.params.name).toBe("José");
    });

    test("it should throw error when withParam receives empty key", () => {
      const event = mock.get("/api/items");
      expect(() => event.withParam("", "value")).toThrow(
        "Invalid parameter key: \"\". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.",
      );
    });

    test("it should throw error when withParam key contains forward slash", () => {
      const event = mock.get("/api/items");
      expect(() => event.withParam("invalid/key", "value")).toThrow(
        "Invalid parameter key: \"invalid/key\". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.",
      );
    });

    test("it should throw error when withParam key contains question mark", () => {
      const event = mock.get("/api/items");
      expect(() => event.withParam("invalid?key", "value")).toThrow(
        "Invalid parameter key: \"invalid?key\". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.",
      );
    });

    test("it should throw error when withParam key contains hash", () => {
      const event = mock.get("/api/items");
      expect(() => event.withParam("invalid#key", "value")).toThrow(
        "Invalid parameter key: \"invalid#key\". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.",
      );
    });

    test("it should throw error when withParam receives empty value", () => {
      const event = mock.get("/api/items");
      expect(() => event.withParam("key", "")).toThrow(
        'Invalid parameter value for key "key": values must be non-empty.',
      );
    });
  });

  describe("withParams", () => {
    test("it should correctly set multiple route parameters from object", () => {
      const event = mock.get("/api/items").withParams({
        userId: "123",
        postId: "456",
        commentId: "789",
      });

      expect(event.params.userId).toBe("123");
      expect(event.params.postId).toBe("456");
      expect(event.params.commentId).toBe("789");
    });

    test("it should correctly merge with existing params", () => {
      const event = mock
        .get("/api/items")
        .withParam("first", "1")
        .withParams({ second: "2", third: "3" });

      expect(event.params.first).toBe("1");
      expect(event.params.second).toBe("2");
      expect(event.params.third).toBe("3");
    });
  });
});

describe("RequestEvent Builder - Locals", () => {
  describe("withLocals", () => {
    test("it should correctly set locals object", () => {
      const event = mock
        .get("/api/items")
        .withLocals({ user: { id: 1, name: "John" } } as App.Locals);
      expect(event.locals).toEqual({ user: { id: 1, name: "John" } });
    });

    test("it should correctly merge with existing locals", () => {
      const event = mock
        .get("/api/items")
        .withLocals({ user: { id: 1 } } as App.Locals)
        .withLocals({ session: "abc123" } as App.Locals);

      expect((event.locals as any).user).toEqual({ id: 1 });
      expect((event.locals as any).session).toBe("abc123");
    });

    test("it should correctly handle nested objects in locals", () => {
      const event = mock.get("/api/items").withLocals({
        user: { id: 1, profile: { name: "John", email: "john@example.com" } },
      } as App.Locals);

      expect((event.locals as any).user.profile.name).toBe("John");
      expect((event.locals as any).user.profile.email).toBe("john@example.com");
    });
  });
});

describe("RequestEvent Builder - Platform", () => {
  describe("withPlatform", () => {
    test("it should correctly set platform object", () => {
      const platform = { env: { API_KEY: "abc123" } };
      const event = mock.get("/api/items").withPlatform(platform);
      expect(event.platform).toEqual(platform);
    });

    test("it should correctly handle empty platform object", () => {
      const event = mock.get("/api/items").withPlatform({} as App.Platform);
      expect(event.platform).toEqual({});
    });
  });
});

describe("RequestEvent Builder - Tracing", () => {
  describe("withTracing", () => {
    test("it should correctly set tracing configuration", () => {
      const span = new MockSpan();
      const tracing = { enabled: true, root: span, current: span };
      const event = mock.get("/api/items").withTracing(tracing);

      expect(event.tracing.enabled).toBe(true);
      expect(event.tracing.root).toBe(span);
      expect(event.tracing.current).toBe(span);
    });

    test("it should correctly set disabled tracing", () => {
      const span = new MockSpan();
      const tracing = { enabled: false, root: span, current: span };
      const event = mock.get("/api/items").withTracing(tracing);

      expect(event.tracing.enabled).toBe(false);
    });
  });
});

describe("RequestEvent Builder - Route", () => {
  describe("withRoute", () => {
    test("it should correctly set route id", () => {
      const event = mock.get("/api/items").withRoute("/api/items/[id]");
      expect(event.route.id).toBe("/api/items/[id]");
    });

    test("it should handle null route", () => {
      const event = mock.get("/api/items");
      expect(event.route.id).toBe(null);
    });
  });
});

describe("RequestEvent Builder - Request Flags", () => {
  describe("withIsDataRequest", () => {
    test("it should correctly set isDataRequest to true", () => {
      const event = mock.get("/api/items").withIsDataRequest(true);
      expect(event.isDataRequest).toBe(true);
    });

    test("it should correctly set isDataRequest to false", () => {
      const event = mock.get("/api/items").withIsDataRequest(false);
      expect(event.isDataRequest).toBe(false);
    });
  });

  describe("withIsSubRequest", () => {
    test("it should correctly set isSubRequest to true", () => {
      const event = mock.get("/api/items").withIsSubRequest(true);
      expect(event.isSubRequest).toBe(true);
    });

    test("it should correctly set isSubRequest to false", () => {
      const event = mock.get("/api/items").withIsSubRequest(false);
      expect(event.isSubRequest).toBe(false);
    });
  });

  describe("withIsRemoteRequest", () => {
    test("it should correctly set isRemoteRequest to true", () => {
      const event = mock.get("/api/items").withIsRemoteRequest(true);
      expect(event.isRemoteRequest).toBe(true);
    });

    test("it should correctly set isRemoteRequest to false", () => {
      const event = mock.get("/api/items").withIsRemoteRequest(false);
      expect(event.isRemoteRequest).toBe(false);
    });
  });
});

describe("RequestEvent Builder - Client Address", () => {
  describe("clientAddress", () => {
    test("it should correctly set client address", () => {
      const event = mock.get("/api/items").clientAddress("192.168.1.1");
      expect(event.getClientAddress()).toBe("192.168.1.1");
    });

    test("it should return default localhost address when not set", () => {
      const event = mock.get("/api/items");
      expect(event.getClientAddress()).toBe("127.0.0.1");
    });

    test("it should correctly handle IPv6 addresses", () => {
      const event = mock
        .get("/api/items")
        .clientAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
      expect(event.getClientAddress()).toBe(
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      );
    });
  });
});

describe("RequestEvent Builder - Fetch", () => {
  describe("withFetch", () => {
    test("it should correctly use custom fetch function", async () => {
      const customFetch = async () => new Response("mocked response");
      const event = mock.get("/api/items").withFetch(customFetch as any);
      const response = await event.fetch("/test");
      const text = await response.text();
      expect(text).toBe("mocked response");
    });

    test("it should correctly handle fetch with relative URLs", async () => {
      const customFetch = async () => new Response("relative response");
      const event = mock.get("/api/base").withFetch(customFetch as any);
      const response = await event.fetch("/api/relative");
      expect(response).toBeDefined();
    });

    test("it should correctly pass through request options to custom fetch", async () => {
      let receivedInit: RequestInit | undefined;
      const customFetch = async (
        _input: string | Request,
        init?: RequestInit,
      ) => {
        receivedInit = init;
        return new Response("ok");
      };
      const event = mock.get("/api/items").withFetch(customFetch as any);
      await event.fetch("/test", { method: "POST", body: "test" });

      expect(receivedInit?.method).toBe("POST");
      expect(receivedInit?.body).toBe("test");
    });
  });
});

describe("RequestEvent Builder - setHeaders", () => {
  describe("setHeaders function", () => {
    test("it should correctly track headers set via setHeaders", () => {
      const event = mock.get("/api/items");
      event.setHeaders({ "X-Custom": "value" });

      expect(() => event.setHeaders({ "X-Another": "value" })).not.toThrow();
    });

    test("it should correctly allow multiple calls to setHeaders", () => {
      const event = mock.get("/api/items");
      event.setHeaders({ "X-Custom": "value1" });
      event.setHeaders({ "X-Another": "value2" });

      expect(() => event.setHeaders({ "X-Third": "value3" })).not.toThrow();
    });

    test("it should correctly handle empty headers object", () => {
      const event = mock.get("/api/items");
      expect(() => event.setHeaders({})).not.toThrow();
    });
  });
});

describe("RequestEvent Builder - Method Chaining", () => {
  test("it should correctly preserve state through fluent builder chaining", () => {
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

  test("it should correctly handle empty builder calls", () => {
    const event = mock.builder();
    expect(event.request.method).toBe("GET");
    expect(event.url.pathname).toBe("/");
  });
});
