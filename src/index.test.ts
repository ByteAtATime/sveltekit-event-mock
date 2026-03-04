import { describe, test, expect } from "bun:test";
import { mock } from "./index";

describe("Integration Tests - Real SvelteKit Handler Scenarios", () => {
  test("it should correctly simulate GET request with authentication", async () => {
    const event = mock
      .get("/api/users")
      .withHeader("Authorization", "Bearer secret-token")
      .withCookie("session", "user-session-id");

    const authHeader = event.request.headers.get("Authorization");
    const session = event.cookies.get("session");

    expect(authHeader).toBe("Bearer secret-token");
    expect(session).toBe("user-session-id");
    expect(event.request.method).toBe("GET");
  });

  test("it should correctly simulate POST request with JSON payload", async () => {
    const payload = { name: "New Item", description: "Test description" };
    const event = mock.post("/api/items").json(payload);

    const clonedRequest = event.request.clone();
    const body = await clonedRequest.json();

    expect(body).toEqual(payload);
    expect(event.request.headers.get("content-type")).toBe("application/json");
  });

  test("it should correctly simulate handler that uses route params", () => {
    const event = mock
      .get("/api/users/123/posts/456")
      .withParam("userId", "123")
      .withParam("postId", "456")
      .withRoute("/api/users/[userId]/posts/[postId]");

    expect(event.params.userId).toBe("123");
    expect(event.params.postId).toBe("456");
    expect(event.route.id).toBe("/api/users/[userId]/posts/[postId]");
  });

  test("it should correctly simulate handler that uses locals", async () => {
    const event = mock.get("/api/protected").withLocals({
      user: { id: 123, role: "admin", email: "admin@example.com" },
    } as App.Locals);

    expect((event.locals as any).user.id).toBe(123);
    expect((event.locals as any).user.role).toBe("admin");
  });

  test("it should correctly simulate form submission handler", async () => {
    const event = mock.post("/api/login").form({
      username: "john@example.com",
      password: "secret123",
    });

    const formData = await event.request.formData();
    expect(formData.get("username")).toBe("john@example.com");
    expect(formData.get("password")).toBe("secret123");
  });

  test("it should correctly simulate complex event with all features", () => {
    const event = mock
      .get("/api/users/[userId]/posts/[postId]")
      .withHeaders({
        Authorization: "Bearer token",
        "X-Custom-Header": "value",
        "X-Request-ID": "req-123",
      })
      .withCookies({
        session: "abc123",
        preferences: "dark-mode",
      })
      .withParam("userId", "123")
      .withParam("postId", "456")
      .withLocals({
        user: { id: 123, role: "admin", email: "admin@example.com" },
      } as App.Locals)
      .withIsDataRequest(true)
      .withRoute("/api/users/[userId]/posts/[postId]")
      .clientAddress("192.168.1.100");

    expect(event.request.method).toBe("GET");
    expect(event.request.headers.get("Authorization")).toBe("Bearer token");
    expect(event.request.headers.get("X-Custom-Header")).toBe("value");
    expect(event.cookies.get("session")).toBe("abc123");
    expect(event.cookies.get("preferences")).toBe("dark-mode");
    expect(event.params.userId).toBe("123");
    expect(event.params.postId).toBe("456");
    expect((event.locals as any).user.role).toBe("admin");
    expect(event.isDataRequest).toBe(true);
    expect(event.route.id).toBe("/api/users/[userId]/posts/[postId]");
    expect(event.getClientAddress()).toBe("192.168.1.100");
  });

  test("it should correctly simulate handler making sub-requests", async () => {
    const mockFetch = async (url: string | Request | URL) => {
      const urlString = url instanceof URL ? url.toString() : String(url);
      if (urlString.includes("external")) {
        return new Response('{"data":"external"}', {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("ok");
    };

    const event = mock.get("/api/internal").withFetch(mockFetch as any);
    const response = await event.fetch("/api/external");

    expect(response).toBeDefined();
    const text = await response.text();
    const data = JSON.parse(text);
    expect(data).toEqual({ data: "external" });
  });

  test("it should correctly simulate data request with cookies and locals", () => {
    const event = mock
      .get("/")
      .withCookies({ session: "session-123", theme: "dark" })
      .withLocals({ user: { id: 1, authenticated: true } } as App.Locals)
      .withIsDataRequest(true);

    expect(event.isDataRequest).toBe(true);
    expect(event.cookies.get("session")).toBe("session-123");
    expect(event.cookies.get("theme")).toBe("dark");
    expect((event.locals as any).user.authenticated).toBe(true);
  });

  test("it should correctly simulate DELETE request with confirmation header", () => {
    const event = mock
      .delete("/api/items/123")
      .withHeader("X-Confirmation", "true")
      .withParam("id", "123");

    expect(event.request.method).toBe("DELETE");
    expect(event.request.headers.get("X-Confirmation")).toBe("true");
    expect(event.params.id).toBe("123");
  });

  test("it should correctly simulate PATCH request with partial update", async () => {
    const updates = { status: "completed" };
    const event = mock.patch("/api/items/123").json(updates);

    const clonedRequest = event.request.clone();
    const body = await clonedRequest.json();

    expect(event.request.method).toBe("PATCH");
    expect(body).toEqual(updates);
    expect(event.request.headers.get("content-type")).toBe("application/json");
  });
});
