import { supabase } from "@/lib/supabaseClient";
import { fetchAllRows } from "@/lib/fetchAll";
import type { DevisStatus } from "@/types/devis";
import {
  previousPeriod,
  type ReportCategory,
  type ReportConfig,
  type ResolvedPeriod,
} from "./types";

// Every query here runs with the signed-in admin's session, so row-level
// security still applies: a non-admin calling this would only get what their
// role may read (sales: their brands' requests; no messages, no newsletter).

export interface SalesRow {
  id: string;
  type: "standard" | "custom";
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  cin_or_nf: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_version: string | null;
  car_price: string | null;
  region: string | null;
  status: DevisStatus;
  note: string | null;
  payment_mode: string | null;
  bank_name: string | null;
  leasing_name: string | null;
  is_first_sale: boolean | null;
  processed_at: string | null;
  sold_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  responded_by: string | null;
}

export interface TestDriveRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  car_model: string;
  car_brand: string | null;
  status: string;
}

export interface AppointmentRow {
  id: string;
  created_at: string | null;
  name: string;
  email: string;
  phone: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: string | null;
  car_chassis: string | null;
  service_types: string[] | null;
  appointment_date: string | null;
  appointment_time: string | null;
  message: string | null;
  status: string | null;
}

export interface MessageRow {
  id: string;
  created_at: string | null;
  name: string;
  email: string;
  message: string;
  status: string;
}

export interface NewsletterRow {
  id: string;
  created_at: string | null;
  email: string;
}

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  brands: string[];
}

export interface ReportData {
  config: ReportConfig;
  period: ResolvedPeriod;
  /** Brand codes actually applied (null = no brand filter). */
  effectiveBrands: string[] | null;
  /** Categories whose rows are exported as detail tables. */
  detailCategories: ReportCategory[];
  sales: SalesRow[];
  testDrives: TestDriveRow[];
  appointments: AppointmentRow[];
  messages: MessageRow[];
  newsletter: NewsletterRow[];
  staff: StaffUser[];
  /** Same filters on the previous period of equal length (sales requests only). */
  previous: { requests: number; sales: number } | null;
  generatedAt: Date;
}

const SALES_COLUMNS =
  "id, created_at, first_name, last_name, email, phone_number, cin_or_nf, car_brand, car_model, car_version, status, note, payment_mode, bank_name, leasing_name, is_first_sale, processed_at, sold_at, completed_at, rejected_at, responded_by";

/** Brands to filter on, after intersecting with the chosen commercial's brands. */
export function effectiveBrandFilter(config: ReportConfig, staff: StaffUser[]): string[] | null {
  const commercial = config.commercialId !== "all" ? staff.find((u) => u.id === config.commercialId) : undefined;
  if (!commercial && config.allBrands) return null;
  let brands = config.brands;
  if (commercial) brands = brands.filter((b) => commercial.brands.includes(b));
  return brands;
}

/** Which sales tables the report needs. */
function salesTablesFor(categories: ReportCategory[]): ("standard" | "custom")[] {
  const wantsDevis = categories.includes("devis");
  const wantsCustom = categories.includes("custom_devis");
  if (wantsDevis || wantsCustom) {
    return [...(wantsDevis ? ["standard" as const] : []), ...(wantsCustom ? ["custom" as const] : [])];
  }
  return categories.includes("sales_stats") ? ["standard", "custom"] : [];
}

async function fetchStaff(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, user_brands(brand)")
    .order("email");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id as string,
    email: u.email as string,
    role: u.role as string,
    brands: ((u.user_brands ?? []) as { brand: string }[]).map((b) => b.brand).sort(),
  }));
}

function salesQuery(
  table: "standard" | "custom",
  range: { from: Date; to: Date },
  brands: string[] | null,
  statuses: DevisStatus[]
) {
  const name = table === "standard" ? "devis_requests" : "custom_devis_requests";
  const columns = table === "standard" ? `${SALES_COLUMNS}, car_price` : `${SALES_COLUMNS}, region`;
  let q = supabase
    .from(name)
    .select(columns)
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString())
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (brands) q = q.in("car_brand", brands);
  if (statuses.length > 0) q = q.in("status", statuses);
  return q;
}

async function countSales(
  table: "standard" | "custom",
  range: { from: Date; to: Date },
  brands: string[] | null,
  statuses: DevisStatus[]
): Promise<number> {
  const name = table === "standard" ? "devis_requests" : "custom_devis_requests";
  let q = supabase
    .from(name)
    .select("id", { count: "exact", head: true })
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString());
  if (brands) q = q.in("car_brand", brands);
  if (statuses.length > 0) q = q.in("status", statuses);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/** Brand filter for tables where the brand may be missing or free text. */
function keepPartialBrand(brand: string | null, brands: string[] | null, includeUnbranded: boolean, known: Set<string>) {
  const code = brand ? brand.trim().toUpperCase() : "";
  const identified = code !== "" && known.has(code);
  if (!identified) return includeUnbranded;
  return brands === null || brands.includes(code);
}

export async function fetchReportData(
  config: ReportConfig,
  period: ResolvedPeriod,
  knownBrandCodes: string[]
): Promise<ReportData> {
  const cats = config.categories;
  const staff = await fetchStaff();
  const brands = effectiveBrandFilter(config, staff);
  const known = new Set(knownBrandCodes);
  const range = { from: period.from, to: period.to };
  const fromIso = period.from.toISOString();
  const toIso = period.to.toISOString();

  // A commercial with no brand in the selection matches nothing.
  const noBrandMatch = brands !== null && brands.length === 0;

  const tables = salesTablesFor(cats);
  const salesPromise = Promise.all(
    tables.map(async (t) => {
      if (noBrandMatch) return [] as SalesRow[];
      const rows = await fetchAllRows<Record<string, unknown>>(() => salesQuery(t, range, brands, config.statuses));
      return rows.map(
        (r) =>
          ({
            ...r,
            type: t,
            car_price: (r.car_price as string | null | undefined) ?? null,
            region: (r.region as string | null | undefined) ?? null,
          }) as SalesRow
      );
    })
  ).then((parts) => parts.flat().sort((a, b) => a.created_at.localeCompare(b.created_at)));

  const testDrivePromise = cats.includes("test_drives")
    ? fetchAllRows<TestDriveRow>(() => {
        let q = supabase
          .from("test_drive_requests")
          .select("id, created_at, full_name, email, phone, car_model, car_brand, status")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true });
        if (config.testDriveStatuses.length > 0) q = q.in("status", config.testDriveStatuses);
        return q;
      }).then((rows) =>
        rows.filter((r) => !noBrandMatch && keepPartialBrand(r.car_brand, brands, config.includeUnbranded, known))
      )
    : Promise.resolve([] as TestDriveRow[]);

  const appointmentPromise = cats.includes("appointments")
    ? fetchAllRows<AppointmentRow>(() =>
        supabase
          .from("appointment_requests")
          .select(
            "id, created_at, name, email, phone, car_brand, car_model, car_year, car_chassis, service_types, appointment_date, appointment_time, message, status"
          )
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
      ).then((rows) =>
        rows.filter((r) => !noBrandMatch && keepPartialBrand(r.car_brand, brands, config.includeUnbranded, known))
      )
    : Promise.resolve([] as AppointmentRow[]);

  const messagePromise = cats.includes("messages")
    ? fetchAllRows<MessageRow>(() =>
        supabase
          .from("contact_messages")
          .select("id, created_at, name, email, message, status")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
      )
    : Promise.resolve([] as MessageRow[]);

  const newsletterPromise = cats.includes("newsletter")
    ? fetchAllRows<NewsletterRow>(() =>
        supabase
          .from("newsletter_subscriptions")
          .select("id, created_at, email")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
      )
    : Promise.resolve([] as NewsletterRow[]);

  // Comparison with the previous period (sales requests only).
  const previousPromise =
    tables.length > 0 && !noBrandMatch
      ? (async () => {
          const prev = previousPeriod(period);
          const saleStatuses: DevisStatus[] =
            config.statuses.length > 0
              ? config.statuses.filter((s) => s === "sold" || s === "completed")
              : ["sold", "completed"];
          const [requests, sales] = await Promise.all([
            Promise.all(tables.map((t) => countSales(t, prev, brands, config.statuses))),
            saleStatuses.length > 0
              ? Promise.all(tables.map((t) => countSales(t, prev, brands, saleStatuses)))
              : Promise.resolve([0]),
          ]);
          return {
            requests: requests.reduce((a, b) => a + b, 0),
            sales: sales.reduce((a, b) => a + b, 0),
          };
        })()
      : Promise.resolve(null);

  const [sales, testDrives, appointments, messages, newsletter, previous] = await Promise.all([
    salesPromise,
    testDrivePromise,
    appointmentPromise,
    messagePromise,
    newsletterPromise,
    previousPromise,
  ]);

  return {
    config,
    period,
    effectiveBrands: brands,
    detailCategories: cats.filter((c) => c !== "sales_stats"),
    sales,
    testDrives,
    appointments,
    messages,
    newsletter,
    staff,
    previous,
    generatedAt: new Date(),
  };
}
