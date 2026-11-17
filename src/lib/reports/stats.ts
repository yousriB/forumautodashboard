import { STATUS_LABELS, STATUS_ORDER, type DevisStatus } from "@/types/devis";
import { brandLabel, type BrandInfo } from "@/lib/brands";
import type { ReportData, SalesRow } from "./fetchReport";
import {
  APPOINTMENT_STATUS_LABELS,
  MESSAGE_STATUS_LABELS,
  PAYMENT_MODE_LABELS,
  TEST_DRIVE_STATUS_LABELS,
} from "./types";

// ─── KPI definitions ─────────────────────────────────────────────────────────
// Every rate is computed on the requests *created* in the period (same rows as
// the tables), so numerator and denominator always describe the same set.

export const KPI_DEFINITIONS: { name: string; formula: string }[] = [
  { name: "Total demandes", formula: "Nombre de demandes de devis (standard + personnalisés) reçues sur la période" },
  {
    name: "Taux de conversion",
    formula: "(Vente confirmée + Livré) / Total demandes × 100",
  },
  { name: "Taux d'annulation", formula: "Annulé / Total demandes × 100" },
  {
    name: "Taux de livraison",
    formula: "Livré / (Vente confirmée + Livré) × 100 — part des ventes déjà livrées",
  },
  {
    name: "En cours de traitement",
    formula: "Nouveau + En cours (demandes non encore conclues)",
  },
  {
    name: "Évolution",
    formula: "Écart avec la période précédente de même durée, mêmes filtres",
  },
  {
    name: "Portefeuille commercial",
    formula:
      "Demandes des marques affectées au commercial. Une marque partagée entre plusieurs comptes est comptée pour chacun.",
  },
  {
    name: "Traitées par le compte",
    formula: "Demandes dont le dernier changement de statut a été fait par ce compte (enregistré depuis le 17/11/2026)",
  },
];

export interface StatusCounts {
  pending: number;
  processing: number;
  sold: number;
  completed: number;
  rejected: number;
}

const emptyCounts = (): StatusCounts => ({ pending: 0, processing: 0, sold: 0, completed: 0, rejected: 0 });

export const pct = (num: number, den: number): number | null => (den > 0 ? (num / den) * 100 : null);

export const formatPct = (v: number | null): string =>
  v === null ? "—" : `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`;

export interface GroupRow {
  key: string;
  label: string;
  total: number;
  counts: StatusCounts;
  conversion: number | null;
}

export interface CommercialRow {
  id: string;
  email: string;
  brands: string[];
  brandLabels: string;
  total: number;
  counts: StatusCounts;
  conversion: number | null;
  handled: number;
  handledSales: number;
}

export interface TrendBucket {
  key: string;
  label: string;
  total: number;
  sales: number;
}

export interface SimpleCount {
  key: string;
  label: string;
  count: number;
}

export interface ReportStats {
  hasSales: boolean;
  total: number;
  standard: number;
  custom: number;
  counts: StatusCounts;
  sales: number;
  open: number;
  conversion: number | null;
  cancellation: number | null;
  delivery: number | null;
  /** Livré without a sold_at date: status from the old workflow, to verify. */
  legacyDelivered: number;
  firstSales: number;
  previous: ReportData["previous"];
  byBrand: GroupRow[];
  byCommercial: CommercialRow[];
  trend: TrendBucket[];
  trendGranularity: "day" | "month";
  paymentModes: SimpleCount[];
  testDrivesByStatus: SimpleCount[];
  testDrivesByBrand: SimpleCount[];
  appointmentsByStatus: SimpleCount[];
  messagesByStatus: SimpleCount[];
  counts_other: { testDrives: number; appointments: number; messages: number; newsletter: number };
}

function countStatuses(rows: SalesRow[]): StatusCounts {
  const c = emptyCounts();
  for (const r of rows) if (r.status in c) c[r.status as DevisStatus] += 1;
  return c;
}

const salesOf = (c: StatusCounts) => c.sold + c.completed;

function countBy<T>(rows: T[], keyOf: (r: T) => string, labelOf: (k: string) => string): SimpleCount[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyOf(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, label: labelOf(key), count }))
    .sort((a, b) => b.count - a.count);
}

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function buildTrend(rows: SalesRow[], from: Date, to: Date, days: number): { buckets: TrendBucket[]; granularity: "day" | "month" } {
  const granularity = days <= 31 ? "day" : "month";
  const buckets = new Map<string, TrendBucket>();
  const pad = (n: number) => String(n).padStart(2, "0");

  if (granularity === "day") {
    for (let d = new Date(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      buckets.set(key, { key, label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, total: 0, sales: 0 });
    }
  } else {
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      buckets.set(key, { key, label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, total: 0, sales: 0 });
    }
  }

  for (const r of rows) {
    const d = new Date(r.created_at);
    const key =
      granularity === "day"
        ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        : `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const b = buckets.get(key);
    if (!b) continue;
    b.total += 1;
    if (r.status === "sold" || r.status === "completed") b.sales += 1;
  }
  return { buckets: [...buckets.values()], granularity };
}

export function computeStats(data: ReportData, brands: BrandInfo[]): ReportStats {
  const rows = data.sales;
  const counts = countStatuses(rows);
  const total = rows.length;
  const sales = salesOf(counts);

  // By brand
  const brandMap = new Map<string, SalesRow[]>();
  for (const r of rows) {
    const k = r.car_brand ?? "";
    brandMap.set(k, [...(brandMap.get(k) ?? []), r]);
  }
  const byBrand: GroupRow[] = [...brandMap.entries()]
    .map(([key, list]) => {
      const c = countStatuses(list);
      return { key, label: brandLabel(key || null, brands), total: list.length, counts: c, conversion: pct(salesOf(c), list.length) };
    })
    .sort((a, b) => b.total - a.total);

  // By commercial (sales accounts only)
  const commercials = data.staff.filter((u) =>
    u.role === "sales" && (data.config.commercialId === "all" || u.id === data.config.commercialId)
  );
  const byCommercial: CommercialRow[] = commercials
    .map((u) => {
      const mine = rows.filter((r) => r.car_brand !== null && u.brands.includes(r.car_brand));
      const handledRows = rows.filter((r) => r.responded_by === u.id);
      const c = countStatuses(mine);
      return {
        id: u.id,
        email: u.email,
        brands: u.brands,
        brandLabels: u.brands.length > 0 ? u.brands.map((b) => brandLabel(b, brands)).join(", ") : "Aucune marque",
        total: mine.length,
        counts: c,
        conversion: pct(salesOf(c), mine.length),
        handled: handledRows.length,
        handledSales: handledRows.filter((r) => r.status === "sold" || r.status === "completed").length,
      };
    })
    .sort((a, b) => b.total - a.total || a.email.localeCompare(b.email));

  const { buckets, granularity } = buildTrend(rows, data.period.from, data.period.to, data.period.days);

  const soldRows = rows.filter((r) => r.status === "sold" || r.status === "completed");
  const paymentModes = countBy(
    soldRows,
    (r) => r.payment_mode ?? "",
    (k) => (k ? PAYMENT_MODE_LABELS[k] ?? k : "Non renseigné")
  );

  return {
    hasSales: data.sales.length > 0 || data.config.categories.some((c) => c === "devis" || c === "custom_devis" || c === "sales_stats"),
    total,
    standard: rows.filter((r) => r.type === "standard").length,
    custom: rows.filter((r) => r.type === "custom").length,
    counts,
    sales,
    open: counts.pending + counts.processing,
    conversion: pct(sales, total),
    cancellation: pct(counts.rejected, total),
    delivery: pct(counts.completed, sales),
    legacyDelivered: rows.filter((r) => r.status === "completed" && !r.sold_at).length,
    firstSales: soldRows.filter((r) => r.is_first_sale).length,
    previous: data.previous,
    byBrand,
    byCommercial,
    trend: buckets,
    trendGranularity: granularity,
    paymentModes,
    testDrivesByStatus: countBy(data.testDrives, (r) => r.status, (k) => TEST_DRIVE_STATUS_LABELS[k] ?? k),
    testDrivesByBrand: countBy(data.testDrives, (r) => r.car_brand ?? "", (k) => brandLabel(k || null, brands)),
    appointmentsByStatus: countBy(data.appointments, (r) => r.status ?? "pending", (k) => APPOINTMENT_STATUS_LABELS[k] ?? k),
    messagesByStatus: countBy(data.messages, (r) => r.status, (k) => MESSAGE_STATUS_LABELS[k] ?? k),
    counts_other: {
      testDrives: data.testDrives.length,
      appointments: data.appointments.length,
      messages: data.messages.length,
      newsletter: data.newsletter.length,
    },
  };
}

/** Status rows in workflow order, for tables and charts. */
export function statusBreakdown(counts: StatusCounts, total: number) {
  return STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABELS[s],
    count: counts[s],
    share: pct(counts[s], total),
  }));
}

/** Variation vs previous period, e.g. "+12,5 %" or "—". */
export function variation(current: number, previous: number | undefined | null): string {
  if (previous === undefined || previous === null) return "—";
  if (previous === 0) return current === 0 ? "0 %" : "nouveau";
  const v = ((current - previous) / previous) * 100;
  const s = v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${v > 0 ? "+" : ""}${s} %`;
}

// ─── Detail table definitions (shared by preview, PDF and Excel) ─────────────

export type CellValue = string | number | Date | null;

export interface DetailTable {
  key: string;
  title: string;
  columns: { header: string; width: number; date?: boolean }[];
  rows: CellValue[][];
}

const d = (v: string | null | undefined): Date | null => (v ? new Date(v) : null);
const fullName = (a: string | null, b: string | null) => [a, b].filter(Boolean).join(" ") || null;

export function buildDetailTables(data: ReportData, brands: BrandInfo[], staffEmail: (id: string | null) => string | null): DetailTable[] {
  const tables: DetailTable[] = [];
  const cats = data.detailCategories;
  const label = (code: string | null) => brandLabel(code, brands);

  const salesColumns = (custom: boolean) => [
    { header: "Date", width: 17, date: true },
    { header: "Client", width: 22 },
    { header: "Téléphone", width: 14 },
    { header: "Email", width: 26 },
    { header: "Marque", width: 16 },
    { header: "Modèle", width: 20 },
    { header: "Version", width: 18 },
    ...(custom ? [{ header: "Région", width: 14 }] : [{ header: "Prix", width: 12 }]),
    { header: "Statut", width: 16 },
    { header: "Paiement", width: 14 },
    { header: "Vente confirmée le", width: 17, date: true },
    { header: "Livré le", width: 17, date: true },
    { header: "Traité par", width: 24 },
  ];
  const salesRow = (r: SalesRow, custom: boolean): CellValue[] => [
    d(r.created_at),
    fullName(r.first_name, r.last_name),
    r.phone_number,
    r.email,
    label(r.car_brand),
    r.car_model,
    r.car_version,
    custom ? r.region : r.car_price,
    STATUS_LABELS[r.status] ?? r.status,
    r.payment_mode ? PAYMENT_MODE_LABELS[r.payment_mode] ?? r.payment_mode : null,
    d(r.sold_at),
    d(r.status === "completed" ? r.completed_at : null), // old-workflow completed_at meant "sale confirmed"
    staffEmail(r.responded_by),
  ];

  if (cats.includes("devis")) {
    tables.push({
      key: "devis",
      title: "Demandes de devis",
      columns: salesColumns(false),
      rows: data.sales.filter((r) => r.type === "standard").map((r) => salesRow(r, false)),
    });
  }
  if (cats.includes("custom_devis")) {
    tables.push({
      key: "custom_devis",
      title: "Devis personnalisés",
      columns: salesColumns(true),
      rows: data.sales.filter((r) => r.type === "custom").map((r) => salesRow(r, true)),
    });
  }
  if (cats.includes("test_drives")) {
    tables.push({
      key: "test_drives",
      title: "Test drives",
      columns: [
        { header: "Date", width: 17, date: true },
        { header: "Client", width: 24 },
        { header: "Téléphone", width: 14 },
        { header: "Email", width: 28 },
        { header: "Marque", width: 16 },
        { header: "Modèle", width: 26 },
        { header: "Statut", width: 14 },
      ],
      rows: data.testDrives.map((r) => [
        d(r.created_at),
        r.full_name,
        r.phone,
        r.email,
        label(r.car_brand),
        r.car_model,
        TEST_DRIVE_STATUS_LABELS[r.status] ?? r.status,
      ]),
    });
  }
  if (cats.includes("appointments")) {
    tables.push({
      key: "appointments",
      title: "Rendez-vous atelier",
      columns: [
        { header: "Reçu le", width: 17, date: true },
        { header: "Client", width: 22 },
        { header: "Téléphone", width: 14 },
        { header: "Email", width: 26 },
        { header: "Marque (saisie)", width: 16 },
        { header: "Modèle", width: 18 },
        { header: "Services", width: 28 },
        { header: "Date RDV", width: 12 },
        { header: "Heure", width: 8 },
        { header: "Statut", width: 12 },
      ],
      rows: data.appointments.map((r) => [
        d(r.created_at),
        r.name,
        r.phone,
        r.email,
        r.car_brand,
        r.car_model,
        (r.service_types ?? []).join(", ") || null,
        r.appointment_date,
        r.appointment_time,
        APPOINTMENT_STATUS_LABELS[r.status ?? "pending"] ?? r.status,
      ]),
    });
  }
  if (cats.includes("messages")) {
    tables.push({
      key: "messages",
      title: "Messages de contact",
      columns: [
        { header: "Date", width: 17, date: true },
        { header: "Nom", width: 22 },
        { header: "Email", width: 28 },
        { header: "Statut", width: 12 },
        { header: "Message", width: 70 },
      ],
      rows: data.messages.map((r) => [
        d(r.created_at),
        r.name,
        r.email,
        MESSAGE_STATUS_LABELS[r.status] ?? r.status,
        r.message,
      ]),
    });
  }
  if (cats.includes("newsletter")) {
    tables.push({
      key: "newsletter",
      title: "Abonnés newsletter",
      columns: [
        { header: "Inscrit le", width: 17, date: true },
        { header: "Email", width: 40 },
      ],
      rows: data.newsletter.map((r) => [d(r.created_at), r.email]),
    });
  }
  return tables;
}

/** Text describing the filters, for PDF/Excel headers. */
export function describeFilters(data: ReportData, brands: BrandInfo[]): { label: string; value: string }[] {
  const c = data.config;
  const commercial = c.commercialId !== "all" ? data.staff.find((u) => u.id === c.commercialId) : undefined;
  const brandText =
    data.effectiveBrands === null
      ? "Toutes les marques"
      : data.effectiveBrands.length === 0
        ? "Aucune marque (sélection vide)"
        : data.effectiveBrands.map((b) => brandLabel(b, brands)).join(", ");
  const out = [
    { label: "Période", value: data.period.label },
    { label: "Marques", value: brandText },
  ];
  const partial = c.categories.some((k) => k === "test_drives" || k === "appointments");
  if (partial) {
    out.push({
      label: "Sans marque identifiée",
      value: c.includeUnbranded ? "Incluses (test drives / rendez-vous)" : "Exclues",
    });
  }
  if (commercial) out.push({ label: "Commercial", value: `${commercial.email} (marques affectées)` });
  if (c.statuses.length > 0) out.push({ label: "Statuts devis", value: c.statuses.map((s) => STATUS_LABELS[s]).join(", ") });
  if (c.testDriveStatuses.length > 0)
    out.push({
      label: "Statuts test drive",
      value: c.testDriveStatuses.map((s) => TEST_DRIVE_STATUS_LABELS[s] ?? s).join(", "),
    });
  if (c.categories.some((k) => k === "messages" || k === "newsletter")) {
    out.push({ label: "Messages / newsletter", value: "Sans association de marque : non filtrés par marque" });
  }
  return out;
}
