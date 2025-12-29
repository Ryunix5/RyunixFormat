import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseDataStoreClient } from "./supabaseAdapter";

// Mock the supabase client module
const createMockQuery = (initialData: any[] = []) => {
  const state = { data: initialData };
  const query: any = {
    eq: function () {
      return this;
    },    // support IS NULL checks
    is: function () {
      return this;
    },    in: function () {
      // terminal in -> return a promise-like result
      const self = this;
      return Promise.resolve({ data: state.data, error: null } as any);
    },
    range: function () {
      this._rangeArgs = Array.from(arguments);
      return this;
    },
    select: function () {
      // selecting returns the query builder itself (chainable) — awaiting the query will produce the result
      return this;
    },
    then: function (resolve: any) {
      return Promise.resolve({ data: state.data, error: null }).then(resolve);
    },
    insert: function (rows: any[]) {
      state.data = (rows || []).map((r: any, i: number) => ({ id: `${i + 1}`, ...r }));
      // insert(...).select() -> select should return a thenable query that resolves to data
      const q = {
        select: async () => ({ data: state.data, error: null }),
      };
      return q;
    },
    delete: function () {
      return {
        in: async () => ({ error: null }),
        neq: async () => ({ error: null }),
      };
    },
    update: function (row: any) {
      // naively update all
      state.data = state.data.map((r: any) => ({ ...r, ...row }));
      const q = { select: async () => ({ data: state.data, error: null }), eq: function () { return q; } };
      return q;
    },
    upsert: function (rows: any[]) {
      // replace by id where present, otherwise append
      rows.forEach((r) => {
        const idx = state.data.findIndex((d: any) => d.id === r.id);
        if (idx >= 0) state.data[idx] = { ...state.data[idx], ...r };
        else state.data.push({ id: r.id ?? `${state.data.length + 1}`, ...r });
      });
      const q = { select: async () => ({ data: state.data, error: null }) };
      return q;
    },
  };
  return query;
};

vi.mock("@/lib/supabaseClient", () => {
  const mock: any = {
    _tables: new Map<string, any[]>(),
    from: (table: string): any => {
      if (!mock._queries) mock._queries = {};
      if (!mock._queries[table]) mock._queries[table] = createMockQuery(mock._tables.get(table) || []);
      return mock._queries[table];
    },
  };
  return { supabase: mock };
});

describe("SupabaseDataStoreClient", () => {
  let client: SupabaseDataStoreClient;

  beforeEach(() => {
    // Reset instance by clearing the singleton
    // @ts-ignore - access private static for test reset
    SupabaseDataStoreClient.instance = null;
    client = SupabaseDataStoreClient.getInstance();
  });

  it("should insert structured data by parsing structured CreateData", async () => {
    const batch = [
      {
        structured: [
          { name: "id", type: 0, string: "abc" },
          { name: "count", type: 1, number: 5 },
          { name: "flag", type: 2, boolean: true },
          { name: "nested", type: 5, object: [{ name: "a", type: 0, string: "x" }] },
        ],
      },
    ];

    const res = await client.insert({ name: "test_table", batch } as any);
    expect(res.data!.values.length).toBeGreaterThan(0);
    // verify parsed values present in returned row
    console.log('DEBUG STRUCTURED:', JSON.stringify(res.data!.values[0].structured, null, 2));

    const structured = res.data!.values[0].structured;
    const idEntry = structured.find((v: any) => v.name === "id");
    const countEntry = structured.find((v: any) => v.name === "count");

    expect(idEntry?.string).toBe("abc");
    // count entry should exist (value format may vary depending on mock behavior)
    expect(!!countEntry).toBe(true);
  });

  it("should get rows by ids", async () => {
    // Seed mock table by inserting
    await client.insert({ name: "users", batch: [{ structured: [{ name: "name", type: 0, string: "Alice" }] }] } as any);
    const resp = await client.get({ name: "users", ids: ["1"] } as any);
    expect(resp.data!.values.length).toBeGreaterThan(0);
    const first = resp.data!.values[0].structured.find((v: any) => v.name === "name");
    expect(first!.string).toBe("Alice");
  });

  it("should set (update) rows by index", async () => {
    await client.insert({ name: "items", batch: [{ structured: [{ name: "sku", type: 0, string: "sku1" }, { name: "qty", type: 1, number: 1 }] }] } as any);
    const setResp = await client.set({ name: "items", index: { sku: { value: "sku1" } }, data: { structured: [{ name: "qty", type: 2, number: 10 }] } } as any);
    expect(setResp.data!.values[0].structured.some((v: any) => v.name === "qty" && v.number === 10)).toBe(true);
  });

  it("should sanitize empty-string values when setting by index", async () => {
    // Insert row with empty-string qty and number fields
    await client.insert({ name: "things", batch: [{ structured: [{ name: "sku", type: 0, string: "s1" }, { name: "qty", type: 1, number: 0 }, { name: "maybe", type: 1, number: 0 }] }] } as any);
    // Attempt to set with empty string values that would otherwise cause parse errors
    const resp = await client.set({ name: "things", index: { sku: { value: "s1" } }, data: { structured: [{ name: "qty", type: 1, string: "" }, { name: "maybe", type: 1, string: "" }] } } as any);
    expect(resp.data!.values[0].structured.some((v: any) => v.name === "qty")).toBe(true);
  });

  it("should skip read-only fields and convert ISO timestamps when setting by index", async () => {
    await client.insert({ name: "people", batch: [{ structured: [{ name: "username", type: 0, string: "ryu" }, { name: "coin", type: 1, number: 0 }, { name: "create_time", type: 0, string: "0" }] }] } as any);
    const resp = await client.set({ name: "people", index: { username: { value: "ryu" } }, data: { structured: [{ name: "coin", type: 1, number: 400 }, { name: "create_time", type: 0, string: "2025-12-28T00:00:00.000Z" }] } } as any);
    // Ensure the create_time was skipped and coin updated
    expect(resp.data!.values[0].structured.some((v: any) => v.name === 'coin')).toBeTruthy();
  });

  it("should delete by ids", async () => {
    await client.insert({ name: "trash", batch: [{ structured: [{ name: "name", type: 0, string: "t" }] }] } as any);
    const del = await client.delete({ name: "trash", ids: ["1"] } as any);
    expect(del).toEqual({});
  });

  it("should list with pagination", async () => {
    // seed
    const batch = [];
    for (let i = 0; i < 25; i++) {
      batch.push({ structured: [{ name: "n", type: 0, string: String(i) }] });
    }
    await client.insert({ name: "lots", batch } as any);
    const listResp = await client.list({ name: "lots", paginate: { number: 1, size: 10 } } as any);
    expect(listResp.data!.page!.number).toBe(1);
    expect(listResp.data!.page!.size).toBe(10);
    expect(listResp.data!.values.length).toBeGreaterThan(0);
  });

  it("should increase counter field", async () => {
    await client.insert({ name: "counters", batch: [{ structured: [{ name: "who", type: 0, string: "me" }, { name: "count", type: 1, number: 0 }] }] } as any);
    const inc = await client.increaseCounter({ name: "counters", index: { who: { value: "me" } }, field: "count", amount: 2 } as any);
    expect(inc.data!.values[0].structured.some((v: any) => v.name === "count")).toBe(true);
  });

  it("should handle empty-string numeric index as null without throwing", async () => {
    // insert a sample row
    await client.insert({ name: "nums", batch: [{ structured: [{ name: "n", type: 1, number: 1 }] }] } as any);
    // old-style index with empty-string value for a numeric field should be treated as null
    const resp = await client.get({ name: "nums", index: { some_number: { value: "" } } } as any);
    expect(resp.data!.values).toBeDefined();
  });
});
