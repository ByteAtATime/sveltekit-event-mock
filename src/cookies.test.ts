import { describe, test, expect } from "bun:test";
import { MockCookies } from "./cookies";

describe("MockCookies", () => {
  describe("get", () => {
    test("it should correctly retrieve a cookie by name when it exists", () => {
      const cookies = new MockCookies();
      cookies.set("session", "abc123", { path: "/" });

      const result = cookies.get("session");
      expect(result).toBe("abc123");
    });

    test("it should return undefined when requesting a non-existent cookie", () => {
      const cookies = new MockCookies();
      const result = cookies.get("nonexistent");
      expect(result).toBeUndefined();
    });

    test("it should correctly decode URI-encoded cookie values", () => {
      const cookies = new MockCookies();
      cookies.set("encoded", "hello%20world", { path: "/" });

      const result = cookies.get("encoded");
      expect(result).toBe("hello world");
    });

    test("it should handle malformed URI-encoded values by returning original value", () => {
      const cookies = new MockCookies();
      cookies.set("malformed", "%invalid", { path: "/" });

      const result = cookies.get("malformed");
      expect(result).toBe("%invalid");
    });

    test("it should use custom decode function when provided via opts", () => {
      const cookies = new MockCookies();
      cookies.set("custom", "base64value", { path: "/" });

      const customDecode = (value: string) => {
        return `decoded:${value}`;
      };

      const result = cookies.get("custom", { decode: customDecode });
      expect(result).toBe("decoded:base64value");
    });

    test("it should return original value when custom decode function throws", () => {
      const cookies = new MockCookies();
      cookies.set("custom", "value", { path: "/" });

      const customDecode = () => {
        throw new Error("Custom decode error");
      };

      const result = cookies.get("custom", { decode: customDecode });
      expect(result).toBe("value");
    });
  });

  describe("set", () => {
    test("it should correctly store a cookie with name and value", () => {
      const cookies = new MockCookies();
      cookies.set("session", "abc123", { path: "/" });

      const result = cookies.get("session");
      expect(result).toBe("abc123");
    });

    test("it should allow overwriting an existing cookie", () => {
      const cookies = new MockCookies();
      cookies.set("session", "abc123", { path: "/" });
      cookies.set("session", "xyz789", { path: "/" });

      const result = cookies.get("session");
      expect(result).toBe("xyz789");
    });
  });

  describe("delete", () => {
    test("it should correctly remove an existing cookie", () => {
      const cookies = new MockCookies();
      cookies.set("session", "abc123", { path: "/" });
      expect(cookies.get("session")).toBe("abc123");

      cookies.delete("session", { path: "/" });
      expect(cookies.get("session")).toBeUndefined();
    });

    test("it should handle deleting a non-existent cookie without error", () => {
      const cookies = new MockCookies();
      expect(() => cookies.delete("nonexistent", { path: "/" })).not.toThrow();
    });
  });

  describe("getAll", () => {
    test("it should correctly return all stored cookies", () => {
      const cookies = new MockCookies();
      cookies.set("session", "abc123", { path: "/" });
      cookies.set("user", "john", { path: "/" });
      cookies.set("theme", "dark", { path: "/" });

      const all = cookies.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContainEqual({ name: "session", value: "abc123" });
      expect(all).toContainEqual({ name: "user", value: "john" });
      expect(all).toContainEqual({ name: "theme", value: "dark" });
    });

    test("it should return an empty array when no cookies are set", () => {
      const cookies = new MockCookies();
      const all = cookies.getAll();
      expect(all).toHaveLength(0);
    });

    test("it should correctly decode all cookie values", () => {
      const cookies = new MockCookies();
      cookies.set("encoded1", "hello%20world", { path: "/" });
      cookies.set("encoded2", "foo%2Bbar", { path: "/" });

      const all = cookies.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual({ name: "encoded1", value: "hello world" });
      expect(all).toContainEqual({ name: "encoded2", value: "foo+bar" });
    });

    test("it should use custom decode function for all cookies when provided via opts", () => {
      const cookies = new MockCookies();
      cookies.set("cookie1", "value1", { path: "/" });
      cookies.set("cookie2", "value2", { path: "/" });

      const customDecode = (value: string) => `decoded:${value}`;

      const all = cookies.getAll({ decode: customDecode });
      expect(all).toHaveLength(2);
      expect(all).toContainEqual({ name: "cookie1", value: "decoded:value1" });
      expect(all).toContainEqual({ name: "cookie2", value: "decoded:value2" });
    });

    test("it should return original values when custom decode function throws in getAll", () => {
      const cookies = new MockCookies();
      cookies.set("cookie1", "value1", { path: "/" });
      cookies.set("cookie2", "value2", { path: "/" });

      const customDecode = () => {
        throw new Error("Custom decode error");
      };

      const all = cookies.getAll({ decode: customDecode });
      expect(all).toHaveLength(2);
      expect(all).toContainEqual({ name: "cookie1", value: "value1" });
      expect(all).toContainEqual({ name: "cookie2", value: "value2" });
    });
  });

  describe("serialize", () => {
    test("it should correctly serialize cookie with name and value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", { path: "/" });

      expect(serialized).toContain("session=abc123");
      expect(serialized).toContain("Path=/");
    });

    test("it should correctly encode cookie name and value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize(
        "session name",
        "value with spaces",
        {
          path: "/",
        },
      );

      expect(serialized).toContain("session%20name=value%20with%20spaces");
    });

    test("it should correctly serialize all standard cookie attributes", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        domain: "example.com",
        httpOnly: true,
        secure: true,
        maxAge: 3600,
      });

      expect(serialized).toContain("session=abc123");
      expect(serialized).toContain("Path=/");
      expect(serialized).toContain("Domain=example.com");
      expect(serialized).toContain("HttpOnly");
      expect(serialized).toContain("Secure");
      expect(serialized).toContain("Max-Age=3600");
    });

    test("it should correctly serialize expires attribute as UTC string", () => {
      const cookies = new MockCookies();
      const expiresDate = new Date("2024-12-31T23:59:59Z");
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        expires: expiresDate,
      });

      expect(serialized).toContain("Expires=Tue, 31 Dec 2024 23:59:59 GMT");
    });

    test("it should correctly serialize sameSite attribute with strict value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        sameSite: "strict",
      });

      expect(serialized).toContain("SameSite=Strict");
    });

    test("it should correctly serialize sameSite attribute with lax value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        sameSite: "lax",
      });

      expect(serialized).toContain("SameSite=Lax");
    });

    test("it should correctly serialize sameSite attribute with none value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        sameSite: "none",
      });

      expect(serialized).toContain("SameSite=None");
    });

    test("it should correctly serialize sameSite attribute as boolean true", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        sameSite: true,
      });

      expect(serialized).toContain("SameSite=Strict");
    });

    test("it should correctly serialize sameSite attribute as boolean false", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        sameSite: false,
      });

      expect(serialized).toContain("SameSite=Lax");
    });

    test("it should throw error when sameSite has invalid string value", () => {
      const cookies = new MockCookies();
      expect(() => {
        cookies.serialize("session", "abc123", {
          path: "/",
          sameSite: "invalid" as any,
        });
      }).toThrow(
        'Invalid sameSite value: invalid. Must be one of: "strict", "lax", "none", true, false',
      );
    });

    test("it should correctly serialize priority attribute with low value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        priority: "low",
      });

      expect(serialized).toContain("Priority=Low");
    });

    test("it should correctly serialize priority attribute with medium value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        priority: "medium",
      });

      expect(serialized).toContain("Priority=Medium");
    });

    test("it should correctly serialize priority attribute with high value", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        priority: "high",
      });

      expect(serialized).toContain("Priority=High");
    });

    test("it should throw error when priority has invalid value", () => {
      const cookies = new MockCookies();
      expect(() => {
        cookies.serialize("session", "abc123", {
          path: "/",
          priority: "invalid" as any,
        });
      }).toThrow(
        "Invalid priority value: invalid. Must be one of: low, medium, high",
      );
    });

    test("it should correctly serialize partitioned attribute", () => {
      const cookies = new MockCookies();
      const serialized = cookies.serialize("session", "abc123", {
        path: "/",
        partitioned: true,
      });

      expect(serialized).toContain("Partitioned");
    });
  });
});
