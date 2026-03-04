import { describe, test, expect } from "bun:test";
import { MockSpan } from "./span";

describe("MockSpan", () => {
  describe("attribute", () => {
    test("it should correctly set a string attribute", () => {
      const span = new MockSpan();
      span.attribute("key1", "value1");

      const attrs = span.__getAttributes();
      expect(attrs.get("key1")).toBe("value1");
    });

    test("it should correctly set a number attribute", () => {
      const span = new MockSpan();
      span.attribute("count", 42);

      const attrs = span.__getAttributes();
      expect(attrs.get("count")).toBe(42);
    });

    test("it should correctly set a boolean attribute", () => {
      const span = new MockSpan();
      span.attribute("enabled", true);

      const attrs = span.__getAttributes();
      expect(attrs.get("enabled")).toBe(true);
    });

    test("it should allow setting multiple attributes", () => {
      const span = new MockSpan();
      span.attribute("key1", "value1");
      span.attribute("key2", 123);
      span.attribute("key3", true);

      const attrs = span.__getAttributes();
      expect(attrs.size).toBe(3);
      expect(attrs.get("key1")).toBe("value1");
      expect(attrs.get("key2")).toBe(123);
      expect(attrs.get("key3")).toBe(true);
    });

    test("it should return self for method chaining", () => {
      const span = new MockSpan();
      const result = span.attribute("key", "value");
      expect(result).toBe(span);
    });
  });

  describe("end", () => {
    test("it should complete without throwing an error", () => {
      const span = new MockSpan();
      expect(() => span.end()).not.toThrow();
    });

    test("it should handle multiple calls to end without error", () => {
      const span = new MockSpan();
      span.end();
      expect(() => span.end()).not.toThrow();
    });
  });

  describe("__getAttributes", () => {
    test("it should return empty map when no attributes are set", () => {
      const span = new MockSpan();
      const attrs = span.__getAttributes();
      expect(attrs.size).toBe(0);
    });
  });
});
