import type { BrandInfo } from "@/lib/brands";
import type { ReportData } from "./fetchReport";
import {
  buildDetailTables,
  describeFilters,
  formatPct,
  KPI_DEFINITIONS,
  statusBreakdown,
  variation,
  type ReportStats,
} from "./stats";
import { formatDateTimeFr } from "./types";

const RED = "FFEF1923";
const GREY = "FFF3F4F6";

export function reportFileName(data: ReportData, ext: "pdf" | "xlsx"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const f = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `forum-auto-rapport_${f(data.period.from)}-${f(data.period.to)}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Excel workbook: Synthèse + breakdown sheets + one sheet per category. */
export async function exportExcel(data: ReportData, stats: ReportStats, brands: BrandInfo[]) {
  const { default: ExcelJS } = await import("exceljs");
  type Worksheet = import("exceljs").Worksheet;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Forum Auto Gabès — Tableau de bord";
  wb.created = data.generatedAt;

  const styleHeader = (ws: Worksheet, rowNumber: number) => {
    const row = ws.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    row.height = 20;
  };

  const sectionTitle = (ws: Worksheet, text: string) => {
    const row = ws.addRow([text]);
    row.font = { bold: true, size: 12, color: { argb: RED } };
    return row;
  };

  /** Add a small table with a styled header; returns nothing. */
  const addTable = (ws: Worksheet, headers: string[], rows: (string | number | null)[][]) => {
    const h = ws.addRow(headers);
    styleHeader(ws, h.number);
    for (const r of rows) ws.addRow(r);
    ws.addRow([]);
  };

  // ── Synthèse ──
  const staffEmail = (id: string | null) => (id ? data.staff.find((u) => u.id === id)?.email ?? id : null);
  const summary = wb.addWorksheet("Synthèse", { views: [{ showGridLines: false }] });
  summary.columns = [{ width: 34 }, { width: 22 }, { width: 16 }, { width: 70 }];
  const title = summary.addRow(["Forum Auto Gabès — Rapport d'activité"]);
  title.font = { bold: true, size: 16, color: { argb: RED } };
  summary.addRow([`Généré le ${formatDateTimeFr(data.generatedAt)}`]).font = { italic: true, color: { argb: "FF6B7280" } };
  summary.addRow([]);

  sectionTitle(summary, "Filtres appliqués");
  for (const f of describeFilters(data, brands)) {
    const r = summary.addRow([f.label, f.value]);
    r.getCell(1).font = { bold: true };
    summary.mergeCells(r.number, 2, r.number, 4);
  }
  summary.addRow([]);

  if (stats.hasSales) {
    sectionTitle(summary, "Indicateurs clés (demandes de devis)");
    addTable(
      summary,
      ["Indicateur", "Valeur", "Période préc.", "Évolution"],
      [
        ["Total demandes", stats.total, data.previous?.requests ?? null, variation(stats.total, data.previous?.requests)],
        ["  dont devis standard", stats.standard, null, null],
        ["  dont devis personnalisés", stats.custom, null, null],
        ["Ventes (Vente confirmée + Livré)", stats.sales, data.previous?.sales ?? null, variation(stats.sales, data.previous?.sales)],
        ["En cours de traitement", stats.open, null, null],
        ["Taux de conversion", formatPct(stats.conversion), null, null],
        ["Taux d'annulation", formatPct(stats.cancellation), null, null],
        ["Taux de livraison", formatPct(stats.delivery), null, null],
        ["Premières ventes (client)", stats.firstSales, null, null],
      ]
    );

    sectionTitle(summary, "Répartition par statut");
    addTable(
      summary,
      ["Statut", "Nombre", "Part"],
      statusBreakdown(stats.counts, stats.total).map((s) => [s.label, s.count, formatPct(s.share)])
    );

    if (stats.legacyDelivered > 0) {
      const r = summary.addRow([
        "À vérifier",
        stats.legacyDelivered,
        null,
        "Demandes « Livré » sans date de vente confirmée : statut hérité de l'ancien flux, non reclassé automatiquement.",
      ]);
      r.font = { color: { argb: "FFB45309" } };
      r.getCell(4).alignment = { wrapText: true };
      summary.addRow([]);
    }

    if (stats.paymentModes.length > 0) {
      sectionTitle(summary, "Modes de paiement (ventes)");
      addTable(summary, ["Mode", "Ventes"], stats.paymentModes.map((p) => [p.label, p.count]));
    }
  }

  const other: (string | number)[][] = [];
  if (data.config.categories.includes("test_drives")) other.push(["Test drives", stats.counts_other.testDrives]);
  if (data.config.categories.includes("appointments")) other.push(["Rendez-vous atelier", stats.counts_other.appointments]);
  if (data.config.categories.includes("messages")) other.push(["Messages de contact", stats.counts_other.messages]);
  if (data.config.categories.includes("newsletter")) other.push(["Nouveaux abonnés newsletter", stats.counts_other.newsletter]);
  if (other.length > 0) {
    sectionTitle(summary, "Autres volumes sur la période");
    addTable(summary, ["Catégorie", "Nombre"], other);
  }

  sectionTitle(summary, "Définitions des indicateurs");
  for (const k of KPI_DEFINITIONS) {
    const r = summary.addRow([k.name, k.formula]);
    r.getCell(1).font = { bold: true };
    summary.mergeCells(r.number, 2, r.number, 4);
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  // ── Par marque / Par commercial / Tendance ──
  if (stats.hasSales) {
    const statusHeaders = statusBreakdown(stats.counts, stats.total).map((s) => s.label);

    const wsBrand = wb.addWorksheet("Par marque", { views: [{ state: "frozen", ySplit: 1 }] });
    wsBrand.columns = [{ width: 22 }, { width: 10 }, ...statusHeaders.map(() => ({ width: 15 })), { width: 14 }];
    wsBrand.addRow(["Marque", "Total", ...statusHeaders, "Conversion"]);
    styleHeader(wsBrand, 1);
    for (const b of stats.byBrand) {
      wsBrand.addRow([
        b.label,
        b.total,
        b.counts.pending,
        b.counts.processing,
        b.counts.sold,
        b.counts.completed,
        b.counts.rejected,
        b.conversion === null ? null : b.conversion / 100,
      ]);
    }
    wsBrand.getColumn(8).numFmt = "0.0%";
    wsBrand.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };

    const wsCom = wb.addWorksheet("Par commercial", { views: [{ state: "frozen", ySplit: 1 }] });
    wsCom.columns = [
      { width: 32 },
      { width: 34 },
      { width: 12 },
      ...statusHeaders.map(() => ({ width: 15 })),
      { width: 13 },
      { width: 16 },
      { width: 18 },
    ];
    wsCom.addRow([
      "Commercial",
      "Marques affectées",
      "Portefeuille",
      ...statusHeaders,
      "Conversion",
      "Traitées par le compte",
      "dont ventes",
    ]);
    styleHeader(wsCom, 1);
    for (const c of stats.byCommercial) {
      wsCom.addRow([
        c.email,
        c.brandLabels,
        c.total,
        c.counts.pending,
        c.counts.processing,
        c.counts.sold,
        c.counts.completed,
        c.counts.rejected,
        c.conversion === null ? null : c.conversion / 100,
        c.handled,
        c.handledSales,
      ]);
    }
    wsCom.getColumn(9).numFmt = "0.0%";
    wsCom.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 11 } };
    wsCom.addRow([]);
    wsCom.addRow([
      "Portefeuille = demandes des marques affectées (une marque partagée compte pour chaque compte). « Traitées par le compte » n'est enregistré que depuis le 17/11/2026.",
    ]).font = { italic: true, color: { argb: "FF6B7280" } };

    const wsTrend = wb.addWorksheet("Tendance", { views: [{ state: "frozen", ySplit: 1 }] });
    wsTrend.columns = [{ width: 16 }, { width: 12 }, { width: 12 }];
    wsTrend.addRow([stats.trendGranularity === "day" ? "Jour" : "Mois", "Demandes", "Ventes"]);
    styleHeader(wsTrend, 1);
    for (const t of stats.trend) wsTrend.addRow([t.label, t.total, t.sales]);

    if (data.config.categories.includes("test_drives") && stats.testDrivesByBrand.length > 0) {
      const ws = wb.addWorksheet("Test drives - synthèse");
      ws.columns = [{ width: 24 }, { width: 12 }];
      addTable(ws, ["Statut", "Nombre"], stats.testDrivesByStatus.map((s) => [s.label, s.count]));
      addTable(ws, ["Marque", "Nombre"], stats.testDrivesByBrand.map((s) => [s.label, s.count]));
    }
  }

  // ── Detail sheets ──
  for (const t of buildDetailTables(data, brands, staffEmail)) {
    const ws = wb.addWorksheet(t.title.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = t.columns.map((c) => ({ width: c.width }));
    ws.addRow(t.columns.map((c) => c.header));
    styleHeader(ws, 1);
    // ExcelJS stores dates as UTC; shift so the cell shows local (Tunis) time.
    for (const r of t.rows) {
      ws.addRow(r.map((v) => (v instanceof Date ? new Date(v.getTime() - v.getTimezoneOffset() * 60_000) : v)));
    }
    t.columns.forEach((c, i) => {
      if (c.date) ws.getColumn(i + 1).numFmt = "dd/mm/yyyy hh:mm";
    });
    if (t.rows.length === 0) {
      ws.addRow(["Aucune donnée pour ces filtres."]).font = { italic: true, color: { argb: "FF6B7280" } };
    } else {
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: t.columns.length } };
      for (let i = 2; i <= t.rows.length + 1; i += 2) {
        ws.getRow(i).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREY } };
        });
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    reportFileName(data, "xlsx")
  );
}
