import type { BrandInfo } from "@/lib/brands";
import { STATUS_HEX } from "@/types/devis";
import type { ReportData } from "./fetchReport";
import {
  buildDetailTables,
  describeFilters,
  formatPct,
  KPI_DEFINITIONS,
  statusBreakdown,
  variation,
  type CellValue,
  type ReportStats,
} from "./stats";
import { downloadBlob, reportFileName } from "./exportExcel";
import { formatDateTimeFr } from "./types";

const RED: [number, number, number] = [239, 25, 35];
const DARK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];

/** The built-in PDF fonts only cover WinAnsi: normalise the characters that fall outside it. */
const t = (s: string | number | null | undefined): string =>
  s === null || s === undefined
    ? ""
    : String(s)
        .replace(/[\u202f\u00a0]/g, " ")
        .replace(/[\u2192\u21d2]/g, "->")
        .replace(/[\u2018\u2019]/g, "'");

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

async function loadLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    const res = await fetch("/brand/forum-auto-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / Math.max(1, img.naturalHeight));
      img.onerror = () => resolve(3);
      img.src = data;
    });
    return { data, ratio };
  } catch {
    return null;
  }
}

const cellText = (v: CellValue): string => (v instanceof Date ? formatDateTimeFr(v) : t(v));

export async function exportPdf(data: ReportData, stats: ReportStats, brands: BrandInfo[]) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadLogo(),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const margin = 14;
  let y = 0;

  const pageW = () => doc.internal.pageSize.getWidth();
  const pageH = () => doc.internal.pageSize.getHeight();
  const lastY = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  const ensureSpace = (h: number) => {
    if (y + h > pageH() - 18) {
      doc.addPage("a4", "portrait");
      y = 20;
    }
  };

  const heading = (text: string) => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...RED);
    doc.text(t(text), margin, y);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.5, pageW() - margin, y + 1.5);
    y += 6;
    doc.setTextColor(...DARK);
  };

  const table = (head: string[], body: (string | number | null)[][], opts: Record<string, unknown> = {}) => {
    autoTable(doc, {
      startY: y,
      head: [head.map(t)],
      body: body.map((r) => r.map((c) => t(c))),
      margin: { left: margin, right: margin, top: 20, bottom: 16 },
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.6, textColor: DARK },
      headStyles: { fillColor: RED, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 247, 249] },
      ...opts,
    });
    y = lastY() + 7;
  };

  // ── Header ──
  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW(), 3, "F");
  y = 12;
  if (logo) {
    const h = 12;
    doc.addImage(logo.data, "PNG", margin, y - 2, h * logo.ratio, h);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("Rapport d'activité", pageW() - margin, y + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(t(`Forum Auto Gabès — généré le ${formatDateTimeFr(data.generatedAt)}`), pageW() - margin, y + 9.5, {
    align: "right",
  });
  y += 20;

  // ── Filters ──
  heading("Paramètres du rapport");
  table(
    ["Filtre", "Valeur"],
    describeFilters(data, brands).map((f) => [f.label, f.value]),
    { columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }, headStyles: { fillColor: DARK, textColor: 255 } }
  );

  // ── KPIs ──
  if (stats.hasSales) {
    heading("Indicateurs clés — demandes de devis");
    const kpis = [
      { label: "Total demandes", value: stats.total.toLocaleString("fr-FR"), sub: `vs préc. : ${variation(stats.total, data.previous?.requests)}` },
      { label: "Ventes", value: stats.sales.toLocaleString("fr-FR"), sub: `vs préc. : ${variation(stats.sales, data.previous?.sales)}` },
      { label: "Taux de conversion", value: formatPct(stats.conversion), sub: "(Vente conf. + Livré) / total" },
      { label: "Taux d'annulation", value: formatPct(stats.cancellation), sub: "Annulé / total" },
    ];
    ensureSpace(24);
    const gap = 4;
    const w = (pageW() - margin * 2 - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach((k, i) => {
      const x = margin + i * (w + gap);
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, w, 20, 2, 2, "FD");
      doc.setFillColor(...RED);
      doc.rect(x, y, 1.2, 20, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(t(k.label), x + 4, y + 5.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...DARK);
      doc.text(t(k.value), x + 4, y + 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(t(k.sub), x + 4, y + 17.5);
    });
    y += 27;

    // Status breakdown: table + horizontal bars
    heading("Répartition par statut");
    const rows = statusBreakdown(stats.counts, stats.total);
    ensureSpace(rows.length * 7 + 6);
    const max = Math.max(1, ...rows.map((r) => r.count));
    const labelW = 34;
    const barMax = pageW() - margin * 2 - labelW - 34;
    doc.setFontSize(9);
    rows.forEach((r, i) => {
      const yy = y + i * 7;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(t(r.label), margin, yy + 4);
      doc.setFillColor(...hexToRgb(STATUS_HEX[r.status]));
      const w = (r.count / max) * barMax;
      if (w > 0) doc.rect(margin + labelW, yy, Math.max(w, 0.8), 5, "F");
      doc.text(t(`${r.count.toLocaleString("fr-FR")}  (${formatPct(r.share)})`), margin + labelW + w + 2, yy + 4);
    });
    y += rows.length * 7 + 4;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      t(`En cours de traitement (Nouveau + En cours) : ${stats.open}   ·   Taux de livraison : ${formatPct(stats.delivery)}   ·   Premières ventes : ${stats.firstSales}`),
      margin,
      y
    );
    y += 5;
    if (stats.legacyDelivered > 0) {
      doc.setTextColor(180, 83, 9);
      const lines = doc.splitTextToSize(
        t(
          `À vérifier : ${stats.legacyDelivered} demande(s) « Livré » sans date de vente confirmée (statut hérité de l'ancien flux, non reclassé automatiquement).`
        ),
        pageW() - margin * 2
      );
      doc.text(lines, margin, y);
      y += lines.length * 4 + 2;
    }
    y += 4;

    // Trend: vertical bars
    if (stats.trend.length > 0) {
      heading(`Tendance (${stats.trendGranularity === "day" ? "par jour" : "par mois"})`);
      const chartH = 45;
      ensureSpace(chartH + 16);
      const x0 = margin + 8;
      const chartW = pageW() - margin * 2 - 8;
      const maxT = Math.max(1, ...stats.trend.map((b) => b.total));
      const slot = chartW / stats.trend.length;
      const bw = Math.max(0.6, Math.min(slot * 0.38, 6));
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      for (let g = 0; g <= 4; g++) {
        const gy = y + chartH - (chartH * g) / 4;
        doc.line(x0, gy, x0 + chartW, gy);
        doc.setFontSize(6.5);
        doc.setTextColor(...MUTED);
        doc.text(String(Math.round((maxT * g) / 4)), x0 - 1.5, gy + 1, { align: "right" });
      }
      const labelEvery = Math.ceil(stats.trend.length / 16);
      stats.trend.forEach((b, i) => {
        const cx = x0 + slot * i + slot / 2;
        const ht = (b.total / maxT) * chartH;
        const hs = (b.sales / maxT) * chartH;
        doc.setFillColor(209, 213, 219);
        if (ht > 0) doc.rect(cx - bw, y + chartH - ht, bw, ht, "F");
        doc.setFillColor(...RED);
        if (hs > 0) doc.rect(cx, y + chartH - hs, bw, hs, "F");
        if (i % labelEvery === 0) {
          doc.setFontSize(6.5);
          doc.setTextColor(...MUTED);
          doc.text(t(b.label), cx, y + chartH + 4, { align: "center" });
        }
      });
      y += chartH + 8;
      doc.setFillColor(209, 213, 219);
      doc.rect(margin, y - 2.5, 3, 3, "F");
      doc.setFillColor(...RED);
      doc.rect(margin + 25, y - 2.5, 3, 3, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK);
      doc.text("Demandes", margin + 4.5, y);
      doc.text("Ventes (Vente confirmée + Livré)", margin + 29.5, y);
      y += 8;
    }

    if (stats.byBrand.length > 0) {
      heading("Performance par marque");
      table(
        ["Marque", "Total", "Nouveau", "En cours", "Vente conf.", "Livré", "Annulé", "Conversion"],
        stats.byBrand.map((b) => [
          b.label,
          b.total,
          b.counts.pending,
          b.counts.processing,
          b.counts.sold,
          b.counts.completed,
          b.counts.rejected,
          formatPct(b.conversion),
        ])
      );
    }

    if (stats.byCommercial.length > 0) {
      heading("Performance par commercial");
      table(
        ["Commercial", "Marques", "Portef.", "Ventes", "Annulé", "Conversion", "Traitées*"],
        stats.byCommercial.map((c) => [
          c.email,
          c.brandLabels,
          c.total,
          c.counts.sold + c.counts.completed,
          c.counts.rejected,
          formatPct(c.conversion),
          c.handled,
        ]),
        { columnStyles: { 1: { cellWidth: 48 } } }
      );
      y -= 4;
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(
        t(
          "Portefeuille = demandes des marques affectées au compte (une marque partagée compte pour chaque compte). * Traitées = dernier changement de statut fait par ce compte, enregistré depuis le 17/11/2026."
        ),
        pageW() - margin * 2
      );
      ensureSpace(lines.length * 3.5);
      doc.text(lines, margin, y);
      y += lines.length * 3.5 + 6;
    }

    if (stats.paymentModes.length > 0) {
      heading("Modes de paiement (ventes)");
      table(["Mode", "Ventes"], stats.paymentModes.map((p) => [p.label, p.count]));
    }
  }

  const other: (string | number)[][] = [];
  const cats = data.config.categories;
  if (cats.includes("test_drives")) other.push(["Test drives", stats.counts_other.testDrives]);
  if (cats.includes("appointments")) other.push(["Rendez-vous atelier", stats.counts_other.appointments]);
  if (cats.includes("messages")) other.push(["Messages de contact", stats.counts_other.messages]);
  if (cats.includes("newsletter")) other.push(["Nouveaux abonnés newsletter", stats.counts_other.newsletter]);
  if (other.length > 0) {
    heading("Autres volumes sur la période");
    table(["Catégorie", "Nombre"], other);
  }
  if (cats.includes("test_drives") && stats.testDrivesByBrand.length > 0) {
    heading("Test drives par marque et par statut");
    table(["Marque", "Nombre"], stats.testDrivesByBrand.map((s) => [s.label, s.count]));
    table(["Statut", "Nombre"], stats.testDrivesByStatus.map((s) => [s.label, s.count]));
  }

  heading("Définitions des indicateurs");
  table(
    ["Indicateur", "Calcul"],
    KPI_DEFINITIONS.map((k) => [k.name, k.formula]),
    { columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } }, headStyles: { fillColor: DARK, textColor: 255 } }
  );

  // ── Detail tables (landscape) ──
  const staffEmail = (id: string | null) => (id ? data.staff.find((u) => u.id === id)?.email ?? null : null);
  for (const tbl of buildDetailTables(data, brands, staffEmail)) {
    doc.addPage("a4", "landscape");
    y = 18;
    heading(`${tbl.title} (${tbl.rows.length.toLocaleString("fr-FR")})`);
    if (tbl.rows.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Aucune donnée pour ces filtres.", margin, y + 2);
      continue;
    }
    const totalW = tbl.columns.reduce((a, c) => a + c.width, 0);
    const avail = pageW() - margin * 2;
    const columnStyles: Record<number, { cellWidth: number }> = {};
    tbl.columns.forEach((c, i) => (columnStyles[i] = { cellWidth: (c.width / totalW) * avail }));
    autoTable(doc, {
      startY: y,
      head: [tbl.columns.map((c) => t(c.header))],
      body: tbl.rows.map((r) => r.map(cellText)),
      margin: { left: margin, right: margin, top: 14, bottom: 16 },
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1.2, textColor: DARK, overflow: "linebreak" },
      headStyles: { fillColor: RED, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 247, 249] },
      columnStyles,
    });
  }

  // ── Footer on every page ──
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const w = pageW();
    const h = pageH();
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, h - 11, w - margin, h - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(t(`Forum Auto Gabès — Rapport ${data.period.label}`), margin, h - 6.5);
    doc.text(`Page ${i} / ${n}`, w - margin, h - 6.5, { align: "right" });
  }

  downloadBlob(doc.output("blob"), reportFileName(data, "pdf"));
}
