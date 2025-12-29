import { supabase } from "@/lib/supabaseClient";
import { DataType, SimpleSelector } from "./common";
import type {
  AllRequest,
  AllResponse,
  InsertRequest,
  InsertResponse,
  PurgeRequest,
  PurgeResponse,
  GetRequest,
  GetResponse,
  SetRequest,
  SetResponse,
  DeleteRequest,
  DeleteResponse,
  MGetRequest,
  MGetResponse,
  MSetRequest,
  MSetResponse,
  ListRequest,
  ListResponse,
  IncreaseCounterRequest,
  IncreaseCounterResponse,
  CountRankedListRequest,
  CountRankedListResponse,
  Data,
  Value,
} from "./common";

/**
 * Supabase-backed implementation that attempts to provide the same
 * high-level contract as the legacy DataStoreClient used by generated ORMs.
 *
 * Notes:
 * - This is a pragmatic implementation supporting common operations used
 *   by the ORMs in this repo (get/insert/set/delete/list/increaseCounter).
 * - It assumes a table name matching the entity `name` (e.g. "user").
 * - It stores JSON data in columns matching the model - this adapter maps
 *   the "structured" CreateData format to a flat object where possible.
 * - This is intentionally conservative — complex filter translation and
 *   advanced features can be added iteratively.
 */
export class SupabaseDataStoreClient {
  private static instance: SupabaseDataStoreClient | null = null;

  public static getInstance(): SupabaseDataStoreClient {
    if (!SupabaseDataStoreClient.instance) {
      SupabaseDataStoreClient.instance = new SupabaseDataStoreClient();
    }
    return SupabaseDataStoreClient.instance;
  }

  // Helper: convert "CreateData" structured value into plain object
  private parseStructured(data: any): Record<string, any> {
    if (!data || !data.structured) return {};
    const out: Record<string, any> = {};
    for (const v of data.structured) {
      if (!v.name) continue;
      switch (v.type) {
        case DataType.string:
        case 0:
          out[v.name] = v.string ?? "";
          break;
        case DataType.number:
        case 1:
          out[v.name] = v.number ?? 0;
          break;
        case DataType.boolean:
        case 2:
          out[v.name] = !!v.boolean;
          break;
        case DataType.enumeration:
        case 3:
          out[v.name] = v.enumeration ?? 0;
          break;
        case DataType.array:
        case 4:
          out[v.name] = (v.array || []).map((a: any) => this.parseStructured({ structured: [a] }));
          break;
        case DataType.object:
        case DataType.reference:
        case 5:
        case 6:
          out[v.name] = this.parseStructured({ structured: v.object || [] });
          break;
        default:
          out[v.name] = null;
      }
    }
    return out;
  }

  // Helper: convert a DB row into a Data structured object
  private rowToData(row: Record<string, any>): Data {
    const structured: Value[] = [];
    for (const [k, v] of Object.entries(row || {})) {
      let type = DataType.string;
      if (typeof v === "number") type = DataType.number;
      else if (typeof v === "boolean") type = DataType.boolean;
      else if (Array.isArray(v)) type = DataType.array;
      else if (typeof v === "object" && v !== null) type = DataType.object;

      const val: Value = {
        type,
        name: k,
        string: typeof v === "string" ? v : v == null ? "" : String(v),
        number: typeof v === "number" ? v : undefined,
        boolean: typeof v === "boolean" ? v : undefined,
        object: [],
        array: [],
      };
      structured.push(val);
    }
    return { structured };
  }

  // Helper: normalize Index or simple index object into a map of field->value
  private indexToFilter(idx: any): Record<string, any> {
    if (!idx) return {};

    // Old style: index as { key: { value: 'x' } } or { key: 'x' }
    if (!Array.isArray(idx.fields) || !Array.isArray(idx.values)) {
      if (typeof idx === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(idx)) {
          const raw = (v as any).value ?? v;
          // Treat empty string as null to avoid SQL errors on numeric columns
          out[k] = raw === "" ? null : raw;
        }
        return out;
      }
      return {};
    }

    // New style: Index { fields: string[], values: Value[] }
    const out: Record<string, any> = {};
    for (let i = 0; i < (idx.fields || []).length; i++) {
      const field = idx.fields[i];
      const val = idx.values[i];
      if (!field) continue;
      if (!val) {
        out[field] = null;
        continue;
      }
      // Prefer typed value; treat empty string for numeric/enumeration as null
      const raw = val.string ?? val.number ?? val.boolean ?? val.enumeration ?? null;
      if (raw === "" && (val.type === DataType.number || val.type === DataType.enumeration)) {
        out[field] = null;
      } else if (raw === "" && val.type === DataType.string) {
        // preserve empty string for string-typed indexes if intended
        out[field] = "";
      } else {
        out[field] = raw;
      }
    }
    return out;
  }

  async all(request: AllRequest): Promise<AllResponse> {
    const table = request.name;
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return {
      data: {
        values: (data || []).map((r: any) => this.rowToData(r)),
      },
    } as AllResponse;
  }

  async insert(request: InsertRequest): Promise<InsertResponse> {
    const table = request.name;
    const batch = request.batch || [];
    let rows = batch.map((b: any) => this.parseStructured(b));

    // Enum mappings for Supabase (which expects text values, not numbers)
    const purchaseItemTypeMap: Record<number, string> = {
      0: 'Unspecified',
      1: 'Deck',
      2: 'Staple',
    };

    // Sanitize rows for insert: remove read-only or empty fields that the backend fills
    rows = rows.map((r: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        // Skip empty strings for fields that should be auto-filled
        if ((v === "" || v === null) && ["id", "data_creator", "data_updater", "create_time", "update_time"].includes(k)) continue;

        // Convert item_type enum from number to string for Supabase
        if (k === "item_type" && typeof v === "number") {
          out[k] = purchaseItemTypeMap[v] ?? 'Unspecified';
          continue;
        }

        // Convert ISO timestamp strings for *_at or *_time fields into unix seconds
        if (typeof v === 'string' && /(_at|_time|bought_at|created_at)$/i.test(k)) {
          const parsed = Date.parse(v);
          if (!Number.isNaN(parsed)) {
            out[k] = Math.floor(parsed / 1000);
            continue;
          }
        }

        // Ensure coin is numeric
        if (k === "coin") {
          if (v === "" || v == null) {
            out[k] = 0;
            continue;
          }
          const n = Number(v);
          out[k] = Number.isFinite(n) ? n : 0;
          continue;
        }
        out[k] = v;
      }
      return out;
    });

    console.debug('Supabase insert rows:', rows);

    const { data, error } = await supabase.from(table).insert(rows).select();
    if (error) {
      console.error('Supabase INSERT error', { table, rows, error });
      throw error;
    }
    return {
      data: { values: (data || []).map((r: any) => this.rowToData(r)) },
    } as InsertResponse;
  }

  async purge(request: PurgeRequest): Promise<PurgeResponse> {
    const table = request.name;
    const { error } = await supabase.from(table).delete().neq("id", "");
    if (error) throw error;
    return {} as PurgeResponse;
  }

  async get(request: GetRequest): Promise<GetResponse> {
    const table = request.name;
    if (request.ids && request.ids.length > 0) {
      const { data, error } = await supabase.from(table).select("*").in("id", request.ids);
      if (error) throw error;
      return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as GetResponse;
    }

    if (request.index) {
      // index is expected to be an object with name/value pairs
      const idx = request.index;
      // translate index to filters
      const filters = this.indexToFilter(idx as any);
      let query = supabase.from(table).select("*");
      for (const [k, v] of Object.entries(filters)) {
        if (v === null) query = query.is(k, null);
        else query = query.eq(k, v as any);
      }
      console.debug('Supabase GET', { table, filters });
      const { data, error } = await query;
      if (error) {
        console.error('Supabase GET error', { table, filters, error });
        throw error;
      }
      return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as GetResponse;
    }

    return { data: { values: [] } } as GetResponse;
  }

  async set(request: SetRequest): Promise<SetResponse> {
    const table = request.name;
    const row = this.parseStructured(request.data);

    // Normalize coin field if present
    if ((row as any).hasOwnProperty('coin')) {
      const n = Number((row as any).coin);
      (row as any).coin = Number.isFinite(n) ? n : 0;
    }

    if (request.index && Object.keys(request.index as any).length > 0) {
      const filters = this.indexToFilter(request.index as any);

      // Sanitize row before update: remove read-only empty fields and normalize numbers
      const sanitized: Record<string, any> = {};
      
      // Enum mappings for Supabase (which expects text values, not numbers)
      const purchaseItemTypeMap: Record<number, string> = {
        0: 'Unspecified',
        1: 'Deck',
        2: 'Staple',
      };
      
      for (const [k, v] of Object.entries(row as any)) {
        // Always skip read-only fields - backend manages these
        if (["id", "data_creator", "data_updater", "create_time", "update_time"].includes(k)) continue;

        // Convert item_type enum from number to string for Supabase
        if (k === "item_type" && typeof v === "number") {
          sanitized[k] = purchaseItemTypeMap[v] ?? 'Unspecified';
          continue;
        }

        // Normalize coin specially
        if (k === 'coin') {
          const n = Number(v);
          sanitized[k] = Number.isFinite(n) ? n : 0;
          continue;
        }

        // Convert empty strings to null to avoid bigint/number parse errors in Postgres
        if (v === "") {
          sanitized[k] = null;
          continue;
        }

        // Convert ISO timestamp strings for *_at or *_time fields into unix seconds
        if (typeof v === 'string' && /(_at|_time|bought_at|created_at)$/i.test(k)) {
          const parsed = Date.parse(v);
          if (!Number.isNaN(parsed)) {
            sanitized[k] = Math.floor(parsed / 1000);
            continue;
          }
        }

        sanitized[k] = v;
      }

      // naive: use first filter for update matching
      const [k, v] = Object.entries(filters)[0] || [];
      const query = supabase.from(table).update(sanitized);
      console.debug('Supabase SET', { table, filters, row, sanitized });
      const res = await (v === null ? query.is(k, null).select() : query.eq(k, v as any).select());
      if (res.error) {
        console.error('Supabase SET error', { table, filters, row, sanitized, error: res.error });
        // If this is a bigint parse error, retry by updating only numeric fields (coin) to avoid empty string casting
        const msg = res.error?.message ?? "";
        if (res.error?.code === '22P02' || /invalid input syntax for type bigint/.test(String(msg))) {
          try {
            console.debug('Supabase SET retry with numeric-only update', { table, key: k, value: v, coin: sanitized.coin });
            const retryQuery = supabase.from(table).update({ coin: sanitized.coin });
            const retryRes = await (v === null ? retryQuery.is(k, null).select() : retryQuery.eq(k, v as any).select());
            if (retryRes.error) {
              console.error('Supabase SET retry failed', { table, key: k, value: v, error: retryRes.error });
              throw retryRes.error;
            }
            const data = retryRes.data;
            return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as SetResponse;
          } catch (e) {
            throw res.error;
          }
        }

        throw res.error;
      }
      const data = res.data;
      return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as SetResponse;
    }

    // fallback: try upsert by id if provided
    if ((row as any).id) {
      // sanitize single row
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(row as any)) {
        if ((v === "" || v === null) && ["id", "data_creator", "data_updater", "create_time", "update_time"].includes(k)) continue;
        out[k] = v;
      }

      // Ensure coin is numeric on upsert
      if (out.hasOwnProperty('coin')) {
        const n = Number(out.coin);
        out.coin = Number.isFinite(n) ? n : 0;
      }

      const { data, error } = await supabase.from(table).upsert(out).select();
      if (error) throw error;
      return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as SetResponse;
    }

    throw new Error("Cannot determine primary key for set operation");
  }

  async delete(request: DeleteRequest): Promise<DeleteResponse> {
    const table = request.name;
    if (request.ids && request.ids.length > 0) {
      const { error } = await supabase.from(table).delete().in("id", request.ids);
      if (error) throw error;
      return {} as DeleteResponse;
    }

    if (request.index) {
      const filters = this.indexToFilter(request.index as any);
      let query = supabase.from(table).delete();
      for (const [k, v] of Object.entries(filters)) {
        if (v === null) query = query.is(k, null);
        else query = query.eq(k, v as any);
      }
      const { error } = await query;
      if (error) throw error;
      return {} as DeleteResponse;
    }

    throw new Error("Nothing to delete");
  }

  async mGet(request: MGetRequest): Promise<MGetResponse> {
    // treat as get for now
    return this.get(request as unknown as GetRequest) as unknown as MGetResponse;
  }

  async mSet(request: MSetRequest): Promise<MSetResponse> {
    // batch set by upserting rows
    const table = request.name;
    let rows = (request.data || []).map((b: any) => this.parseStructured(b));
    // Sanitize rows like in insert
    rows = rows.map((r: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        if ((v === "" || v === null) && ["id", "data_creator", "data_updater", "create_time", "update_time"].includes(k)) continue;
        // Normalize coin field
        if (k === 'coin') {
          const n = typeof v === 'string' ? (v === '' ? 0 : Number(v)) : v;
          out[k] = Number.isFinite(Number(n)) ? Number(n) : 0;
          continue;
        }
        out[k] = v;
      }
      return out;
    });
    const { data, error } = await supabase.from(table).upsert(rows).select();
    if (error) throw error;
    return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as MSetResponse;
  }

  async list(request: ListRequest): Promise<ListResponse> {
    const table = request.name;
    let query = supabase.from(table).select("*");

    if (request.filter && request.filter.simples && request.filter.simples.length > 0) {
      for (const f of request.filter.simples) {
        if (f.symbol === SimpleSelector.equal) {
          // equal
          query = query.eq(f.field, f.value as any);
        }
        if (f.symbol === SimpleSelector.in) {
          // in
          query = query.in(f.field, f.value as unknown as any[]);
        }
      }
    }

    if (request.paginate) {
      const page = request.paginate.number || 0;
      const size = request.paginate.size || 100;
      query = query.range(page * size, page * size + size - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    const values = (data || []).map((r: any) => this.rowToData(r));

    const page = { number: request.paginate?.number || 0, size: request.paginate?.size || (data || []).length };

    return { data: { values, page } } as ListResponse;
  }

  async increaseCounter(request: IncreaseCounterRequest): Promise<IncreaseCounterResponse> {
    const table = request.name;
    if (!request.index) throw new Error("increaseCounter requires an index");
    const filters = this.indexToFilter(request.index as any);
    const [k, v] = Object.entries(filters)[0] || [];
    const field = (request as any).field || "count";
    const amount = (request as any).amount ?? (request.delta ?? 1);
    const query = supabase.from(table).update({ [field]: amount });
    console.debug('Supabase increaseCounter', { table, key: k, value: v, field, amount });
    const res = await (v === null ? query.is(k, null).select() : query.eq(k, v as any).select());
    if (res.error) {
      console.error('Supabase increaseCounter error', { table, key: k, value: v, field, amount, error: res.error });
      throw res.error;
    }
    const data = res.data;
    return { data: { values: (data || []).map((r: any) => this.rowToData(r)) } } as IncreaseCounterResponse;
  }

  async countRankedList(request: CountRankedListRequest): Promise<CountRankedListResponse> {
    // Not implemented - return empty Result
    return { data: { values: [], page: { number: 0, size: 0 } } } as CountRankedListResponse;
  }
}
