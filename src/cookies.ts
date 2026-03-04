import type { Cookies } from "@sveltejs/kit";
import type { CookieParseOptions, CookieSerializeOptions } from "cookie";

export class MockCookies implements Cookies {
  private store = new Map<string, string>();

  private decodeCookieValue(
    name: string,
    value: string,
    opts?: CookieParseOptions,
  ): string {
    const decoder = opts?.decode || decodeURIComponent;

    try {
      return decoder(value);
    } catch (err) {
      if (
        typeof process !== "undefined" &&
        process.env?.NODE_ENV !== "production"
      ) {
        console.warn(`Failed to decode cookie "${name}":`, err);
      }
      return value;
    }
  }

  get(name: string, opts?: CookieParseOptions): string | undefined {
    const value = this.store.get(name);
    if (!value) return undefined;

    return this.decodeCookieValue(name, value, opts);
  }

  set(
    name: string,
    value: string,
    opts: CookieSerializeOptions & { path: string },
  ): void {
    this.store.set(name, value);
  }

  delete(name: string, opts: CookieSerializeOptions & { path: string }): void {
    this.store.delete(name);
  }

  private serializeSameSite(
    sameSite: Exclude<CookieSerializeOptions["sameSite"], undefined>,
  ): string {
    const allowedSameSiteValues = ["strict", "lax", "none", true, false];
    if (!allowedSameSiteValues.includes(sameSite)) {
      throw new Error(
        `Invalid sameSite value: ${String(sameSite)}. Must be one of: ${allowedSameSiteValues.map((v) => JSON.stringify(v)).join(", ")}`,
      );
    }

    if (typeof sameSite === "boolean") {
      return sameSite ? "Strict" : "Lax";
    }

    return sameSite.charAt(0).toUpperCase() + sameSite.slice(1);
  }

  private serializePriority(priority: string): string {
    const allowedPriorityValues = ["low", "medium", "high"];
    if (!allowedPriorityValues.includes(priority)) {
      throw new Error(
        `Invalid priority value: ${priority}. Must be one of: ${allowedPriorityValues.join(", ")}`,
      );
    }

    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  serialize(
    name: string,
    value: string,
    opts: CookieSerializeOptions & { path: string },
  ): string {
    if (opts.maxAge !== undefined && typeof opts.maxAge !== "number") {
      throw new Error(
        `Invalid maxAge: expected number, got ${typeof opts.maxAge}`,
      );
    }
    if (opts.expires && !(opts.expires instanceof Date)) {
      throw new Error(
        `Invalid expires: expected Date, got ${typeof opts.expires}`,
      );
    }

    const attributeHandlers: Record<
      string,
      (value: any) => string | null
    > = {
      path: (v) => (v !== undefined ? `; Path=${String(v)}` : null),
      domain: (v) => (v ? `; Domain=${String(v)}` : null),
      maxAge: (v) => (v !== undefined ? `; Max-Age=${String(v)}` : null),
      expires: (v) => (v ? `; Expires=${v.toUTCString()}` : null),
      httpOnly: (v) => (v ? "; HttpOnly" : null),
      secure: (v) => (v ? "; Secure" : null),
    };

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    Object.entries(attributeHandlers).forEach(([key, handler]) => {
      const result = handler((opts as any)[key]);
      if (result) cookie += result;
    });

    if (opts.sameSite !== undefined) {
      cookie += `; SameSite=${this.serializeSameSite(opts.sameSite)}`;
    }
    if (opts.priority) {
      cookie += `; Priority=${this.serializePriority(opts.priority)}`;
    }
    if (opts.partitioned) {
      cookie += "; Partitioned";
    }

    return cookie;
  }

  getAll(opts?: CookieParseOptions): Array<{ name: string; value: string }> {
    const entries = Array.from(this.store.entries());

    return entries.map(([name, value]) => ({
      name,
      value: this.decodeCookieValue(name, value, opts),
    }));
  }

  __getStore(): Map<string, string> {
    return this.store;
  }
}
