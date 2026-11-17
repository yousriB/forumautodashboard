import type { DevisStatus } from "@/types/devis";

// ─── Categories ──────────────────────────────────────────────────────────────

export type ReportCategory =
  | "devis"
  | "custom_devis"
  | "test_drives"
  | "appointments"
  | "messages"
  | "newsletter"
  | "sales_stats";

/** How a category relates to the brand filter. */
export type BrandScope = "brand" | "partial" | "none";

export const CATEGORY_META: Record<
  ReportCategory,
  { label: string; short: string; description: string; brandScope: BrandScope }
> = {
  devis: {
    label: "Demandes de devis",
    short: "Devis",
    description: "Demandes de proforma sur un véhicule du catalogue",
    brandScope: "brand",
  },
  custom_devis: {
    label: "Demandes de devis personnalisés",
    short: "Devis personnalisés",
    description: "Demandes libres (marque, modèle, version, région)",
    brandScope: "brand",
  },
  test_drives: {
    label: "Demandes de Test Drive",
    short: "Test drives",
    description: "Marque déduite du modèle demandé",
    brandScope: "partial",
  },
  appointments: {
    label: "Rendez-vous atelier",
    short: "Rendez-vous",
    description: "Marque du véhicule du client (saisie libre)",
    brandScope: "partial",
  },
  messages: {
    label: "Messages de contact",
    short: "Messages",
    description: "Sans association de marque",
    brandScope: "none",
  },
  newsletter: {
    label: "Abonnés newsletter",
    short: "Newsletter",
    description: "Sans association de marque",
    brandScope: "none",
  },
  sales_stats: {
    label: "Statistiques de ventes",
    short: "Statistiques",
    description: "Indicateurs, répartitions, performance et tendances",
    brandScope: "brand",
  },
};

export const CATEGORY_ORDER: ReportCategory[] = [
  "sales_stats",
  "devis",
  "custom_devis",
  "test_drives",
  "appointments",
  "messages",
  "newsletter",
];

// ─── Other statuses (each table keeps its own values) ────────────────────────

export const TEST_DRIVE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Effectué",
  cancelled: "Annulé",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  unread: "Non lu",
  read: "Lu",
  responded: "Répondu",
};

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  comptant: "Comptant",
  leasing: "Leasing",
  bank: "Crédit bancaire",
};

// ─── Configuration ───────────────────────────────────────────────────────────

export type PeriodPreset = "today" | "last7" | "last30" | "this_month" | "this_year" | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Aujourd'hui",
  last7: "7 derniers jours",
  last30: "30 derniers jours",
  this_month: "Ce mois-ci",
  this_year: "Cette année",
  custom: "Période personnalisée",
};

export interface ReportConfig {
  categories: ReportCategory[];
  /** Selected brand codes. */
  brands: string[];
  /** True when every brand is selected: no brand filter is applied at all. */
  allBrands: boolean;
  /** Keep test drives / appointments whose brand could not be identified. */
  includeUnbranded: boolean;
  period: PeriodPreset;
  /** yyyy-mm-dd, used when period = "custom". */
  customFrom: string;
  customTo: string;
  /** Sales statuses to keep (empty = all). */
  statuses: DevisStatus[];
  /** Test drive statuses to keep (empty = all). */
  testDriveStatuses: string[];
  /** A sales account id: restricts brands to the ones assigned to it. */
  commercialId: string;
}

export interface ResolvedPeriod {
  from: Date;
  to: Date;
  label: string;
  /** Number of calendar days covered (inclusive). */
  days: number;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export const formatDateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTimeFr = (d: Date) =>
  d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Parse "yyyy-mm-dd" as a local date (not UTC). */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolvePeriod(config: Pick<ReportConfig, "period" | "customFrom" | "customTo">, now = new Date()): ResolvedPeriod | null {
  let from: Date;
  let to: Date = endOfDay(now);
  switch (config.period) {
    case "today":
      from = startOfDay(now);
      break;
    case "last7":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      break;
    case "last30":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
      break;
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom": {
      const f = parseLocalDate(config.customFrom);
      const t = parseLocalDate(config.customTo);
      if (!f || !t || f > t) return null;
      from = startOfDay(f);
      to = endOfDay(t);
      break;
    }
  }
  const days = Math.round((startOfDay(to).getTime() - from.getTime()) / 86_400_000) + 1;
  const range = `du ${formatDateFr(from)} au ${formatDateFr(to)}`;
  const label = config.period === "custom" ? range : `${PERIOD_LABELS[config.period]} (${range})`;
  return { from, to, label, days };
}

/** The period of equal length that ends right before `period` starts. */
export function previousPeriod(period: ResolvedPeriod): { from: Date; to: Date } {
  const to = new Date(period.from.getTime() - 1);
  const from = startOfDay(new Date(period.from.getFullYear(), period.from.getMonth(), period.from.getDate() - period.days));
  return { from, to };
}
