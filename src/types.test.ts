import { describe, test, expect } from "bun:test";
import { type RouteParamsFromRoute } from "./types";

describe("RouteParamsFromRoute type", () => {
  describe("type extraction", () => {
    test("it should correctly extract single parameter from route", () => {
      type Params = RouteParamsFromRoute<"/api/items/[id]">;
      const params: Params = { id: "123" };
      expect(params.id).toBe("123");
    });

    test("it should correctly extract multiple parameters from route", () => {
      type Params =
        RouteParamsFromRoute<"/api/items/[id]/comments/[commentId]">;
      const params: Params = { id: "123", commentId: "456" };
      expect(params.id).toBe("123");
      expect(params.commentId).toBe("456");
    });

    test("it should return empty type for route without parameters", () => {
      type Params = RouteParamsFromRoute<"/api/items">;
      const params: Params = {};
      expect(Object.keys(params)).toHaveLength(0);
    });

    test("it should correctly extract parameters with complex patterns", () => {
      type Params =
        RouteParamsFromRoute<"/api/users/[userId]/posts/[postId]/comments/[commentId]">;
      const params: Params = {
        userId: "123",
        postId: "456",
        commentId: "789",
      };
      expect(params.userId).toBe("123");
      expect(params.postId).toBe("456");
      expect(params.commentId).toBe("789");
    });
  });
});
