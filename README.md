# sveltekit-event-mock

Ergonomic event mocking for SvelteKit server-side testing with a simple builder API.

## Installation

```bash
bun add -d sveltekit-event-mock
pnpm add -D sveltekit-event-mock
```

## Quick Start

```ts
import { mock } from "sveltekit-event-mock";
import { describe, test, expect } from "bun:test";
import { GET, POST } from "./+server";

describe("my handler", () => {
  test("handles GET request with auth", async () => {
    const event = mock
      .get("/api/users")
      .withHeader("Authorization", "Bearer token")
      .withCookie("session", "user-session-id");

    const result = await GET(event);
    const data = await result.json();

    expect(data.key).toEqual("123");
  });

  test("handles POST with JSON payload", async () => {
    const event = mock.post("/api/items").json({ name: "New Item" });

    const result = await GET(event);
    const data = await result.json();

    expect(data).toEqual({ name: "New Item" });
  });
});
```

## API Overview

### HTTP Methods

```ts
mock.get(url); // GET request
mock.post(url); // POST request
mock.put(url); // PUT request
mock.delete(url); // DELETE request
mock.patch(url); // PATCH request
mock.head(url); // HEAD request
mock.options(url); // OPTIONS request
```

### Request Body

```ts
mock
  .post("/api/data")
  .json({ key: "value" }) // JSON body
  .text("plain text") // Plain text
  .form({ field: "value", file }); // Form data
```

### Headers & Cookies

```ts
mock
  .get("/api/data")
  .withHeader("Authorization", "Bearer token")
  .withHeaders({ "X-Custom": "value" })
  .withCookie("session", "session-id")
  .withCookies({ theme: "dark", lang: "en" });
```

### Route Parameters

```ts
mock
  .get("/api/users/[userId]/posts/[postId]")
  .withParam("userId", "123")
  .withParam("postId", "456")
  .withRoute("/api/users/[userId]/posts/[postId]");
```

### Event Properties

```ts
mock
  .get("/api/data")
  .withLocals({ user: { id: 123 } } as App.Locals)
  .withIsDataRequest(true)
  .withIsSubRequest(false)
  .withIsRemoteRequest(true)
  .clientAddress("192.168.1.100")
  .withPlatform(platform);
```

### Fetch Mocking

```ts
const mockFetch = async (url) => {
  return new Response('{"data":"mocked"}', {
    headers: { "Content-Type": "application/json" },
  });
};

const event = mock.get("/api/internal").withFetch(mockFetch);
const response = await event.fetch("/api/external");
```

## Exports

- `mock` – Main builder object with HTTP method shortcuts
- `MockRequestEventBuilder` – Builder class
- `MockCookies` – Mock cookies implementation
- `MockSpan` – Mock span for tracing
- Types: `RequestEvent`, `Cookies`, `RouteParams`, `Span`, `Tracing`

## License

MIT
