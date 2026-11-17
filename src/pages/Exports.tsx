import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, FileText, Loader2, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrandMultiSelect } from "@/components/BrandMultiSelect";
import { useUser } from "@/context/UserContext";
import { useBrands } from "@/lib/brands";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_ORDER, type DevisStatus } from "@/types/devis";
import { fetchReportData, type ReportData } from "@/lib/reports/fetchReport";
import {
  buildDetailTables,
  computeStats,
  describeFilters,
  formatPct,
  statusBreakdown,
  variation,
} from "@/lib/reports/stats";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  PERIOD_LABELS,
  TEST_DRIVE_STATUS_LABELS,
  formatDateTimeFr,
  resolvePeriod,
  type PeriodPreset,
  type ReportCategory,
  type ReportConfig,
} from "@/lib/reports/types";

const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const PREVIEW_ROWS = 10;

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs sm:text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Exports() {
  const { user } = useUser();
  const { brands, activeBrands } = useBrands();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<ReportCategory[]>(["sales_stats", "devis", "custom_devis"]);
  const [selectedBrands, setSelectedBrands] = useState<string[] | null>(null); // null = all brands
  const [includeUnbranded, setIncludeUnbranded] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>("this_month");
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const [statuses, setStatuses] = useState<DevisStatus[]>([]);
  const [testDriveStatuses, setTestDriveStatuses] = useState<string[]>([]);
  const [commercialId, setCommercialId] = useState("all");
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

  // Brand options: every brand in the catalogue (retired ones for history).
  const brandOptions = brands;
  const brandValue = selectedBrands ?? brandOptions.map((b) => b.code);
  const allBrands = selectedBrands === null || brandValue.length === brandOptions.length;

  const config: ReportConfig = {
    categories: CATEGORY_ORDER.filter((c) => categories.includes(c)),
    brands: brandValue,
    allBrands,
    includeUnbranded,
    period,
    customFrom,
    customTo,
    statuses,
    testDriveStatuses,
    commercialId,
  };
  const configKey = JSON.stringify(config);
  const debouncedKey = useDebounce(configKey, 400);
  const debouncedConfig = useMemo(() => JSON.parse(debouncedKey) as ReportConfig, [debouncedKey]);
  const resolved = resolvePeriod(debouncedConfig);
  const periodInvalid = period === "custom" && resolvePeriod(config) === null;

  const knownCodes = useMemo(() => brands.map((b) => b.code), [brands]);

  const query = useQuery<ReportData>({
    queryKey: queryKeys.reports.data(debouncedKey),
    queryFn: () => fetchReportData(debouncedConfig, resolved!, knownCodes),
    enabled: isAdmin && !!resolved && debouncedConfig.categories.length > 0,
    staleTime: 60_000,
  });

  const data = query.data;
  const stats = useMemo(() => (data ? computeStats(data, brands) : null), [data, brands]);
  const tables = useMemo(
    () => (data ? buildDetailTables(data, brands, (id) => (id ? data.staff.find((u) => u.id === id)?.email ?? null : null)) : []),
    [data, brands]
  );

  const commercials = (data?.staff ?? []).filter((u) => u.role === "sales");
  const wantsSales = categories.some((c) => c === "devis" || c === "custom_devis" || c === "sales_stats");
  const wantsPartial = categories.some((c) => c === "test_drives" || c === "appointments");
  const wantsBrandless = categories.some((c) => c === "messages" || c === "newsletter");
  const stale = debouncedKey !== configKey || query.isFetching;

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const runExport = async (kind: "pdf" | "xlsx") => {
    if (!data || !stats) return;
    setExporting(kind);
    try {
      if (kind === "pdf") {
        const { exportPdf } = await import("@/lib/reports/exportPdf");
        await exportPdf(data, stats, brands);
      } else {
        const { exportExcel } = await import("@/lib/reports/exportExcel");
        await exportExcel(data, stats, brands);
      }
      toast({ title: "Export terminé", description: kind === "pdf" ? "Le rapport PDF a été téléchargé." : "Le fichier Excel a été téléchargé." });
    } catch (e) {
      toast({
        title: "Échec de l'export",
        description: e instanceof Error ? e.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-medium">Accès réservé aux administrateurs</h1>
          <p className="text-sm text-muted-foreground">La page Export & Rapports n'est disponible que pour les comptes administrateur.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Export & Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Composer un rapport, le vérifier puis l'exporter en PDF ou en Excel
          </p>
        </div>

        {/* ── Configuration du rapport ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration du rapport</CardTitle>
            <CardDescription>Données, marques, période et filtres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Données à inclure</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((c) => (
                  <Chip
                    key={c}
                    active={categories.includes(c)}
                    onClick={() => setCategories((prev) => toggle(prev, c))}
                    title={CATEGORY_META[c].description}
                  >
                    {CATEGORY_META[c].label}
                  </Chip>
                ))}
              </div>
              {categories.length === 0 && <p className="text-xs text-destructive">Sélectionnez au moins une catégorie.</p>}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Marques</Label>
                <BrandMultiSelect
                  options={brandOptions.map((b) => (b.active ? b : { ...b, label: `${b.label} (historique)` }))}
                  value={brandValue}
                  onChange={(next) => setSelectedBrands(next.length === brandOptions.length ? null : next)}
                />
                {wantsPartial && (
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <Switch id="unbranded" checked={includeUnbranded} onCheckedChange={setIncludeUnbranded} />
                    <div>
                      <Label htmlFor="unbranded" className="cursor-pointer">
                        Inclure les demandes sans marque identifiée
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Test drives et rendez-vous dont la marque est vide ou inconnue. Elles sont listées séparément sous « Sans marque ».
                      </p>
                    </div>
                  </div>
                )}
                {wantsBrandless && (
                  <p className="text-xs text-muted-foreground">
                    Messages et newsletter n'ont pas de marque : ils ne sont pas filtrés par marque.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PERIOD_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {period === "custom" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="from" className="text-xs">Date de début</Label>
                        <Input id="from" type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to" className="text-xs">Date de fin</Label>
                        <Input id="to" type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {periodInvalid && <p className="text-xs text-destructive">La date de début doit précéder la date de fin.</p>}
                  {resolved && !periodInvalid && <p className="text-xs text-muted-foreground">{resolved.label}</p>}
                </div>

                {wantsSales && (
                  <>
                    <div className="space-y-2">
                      <Label>Statut des devis</Label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_ORDER.map((s) => (
                          <Chip key={s} active={statuses.includes(s)} onClick={() => setStatuses((prev) => toggle(prev, s))}>
                            {STATUS_LABELS[s]}
                          </Chip>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Aucun statut sélectionné = tous les statuts.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Commercial</Label>
                      <Select value={commercialId} onValueChange={setCommercialId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les commerciaux</SelectItem>
                          {commercials.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Limite le rapport aux marques affectées à ce compte (croisées avec la sélection de marques).
                      </p>
                    </div>
                  </>
                )}

                {categories.includes("test_drives") && (
                  <div className="space-y-2">
                    <Label>Statut des test drives</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TEST_DRIVE_STATUS_LABELS).map(([k, l]) => (
                        <Chip
                          key={k}
                          active={testDriveStatuses.includes(k)}
                          onClick={() => setTestDriveStatuses((prev) => toggle(prev, k))}
                        >
                          {l}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Aperçu du rapport ── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">Aperçu du rapport</CardTitle>
              <CardDescription>
                {data ? `Données chargées le ${formatDateTimeFr(data.generatedAt)}` : "Les données se mettent à jour selon la configuration"}
              </CardDescription>
            </div>
            {stale && categories.length > 0 && !periodInvalid && (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" aria-label="Chargement" />
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {query.isError && (
              <p className="text-sm text-destructive">
                Impossible de charger les données : {query.error instanceof Error ? query.error.message : "erreur inconnue"}
              </p>
            )}
            {!data && query.isLoading && <p className="text-sm text-muted-foreground">Chargement des données…</p>}
            {data && stats && (
              <>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {describeFilters(data, brands).map((f) => (
                    <span key={f.label}>
                      <span className="font-medium text-foreground">{f.label} :</span> {f.value}
                    </span>
                  ))}
                </div>

                {stats.hasSales && (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <Kpi label="Total demandes" value={stats.total.toLocaleString("fr-FR")} hint={`Période préc. : ${variation(stats.total, data.previous?.requests)}`} />
                      <Kpi label="Ventes" value={stats.sales.toLocaleString("fr-FR")} hint={`Vente confirmée + Livré · ${variation(stats.sales, data.previous?.sales)}`} />
                      <Kpi label="Taux de conversion" value={formatPct(stats.conversion)} hint="Ventes / total" />
                      <Kpi label="Taux d'annulation" value={formatPct(stats.cancellation)} hint="Annulé / total" />
                      <Kpi label="Taux de livraison" value={formatPct(stats.delivery)} hint="Livré / ventes" />
                      <Kpi label="En cours de traitement" value={stats.open.toLocaleString("fr-FR")} hint="Nouveau + En cours" />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-5">
                      {statusBreakdown(stats.counts, stats.total).map((s) => (
                        <div key={s.status} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <span>{s.label}</span>
                          <span className="font-medium">
                            {s.count} <span className="text-xs text-muted-foreground">({formatPct(s.share)})</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {stats.legacyDelivered > 0 && (
                      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {stats.legacyDelivered} demande(s) « Livré » sans date de vente confirmée : statut hérité de l'ancien
                          flux, conservé tel quel. À vérifier avant d'interpréter le taux de livraison.
                        </span>
                      </div>
                    )}

                    {stats.byBrand.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Par marque</h3>
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Marque</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Ventes</TableHead>
                                <TableHead className="text-right">Annulé</TableHead>
                                <TableHead className="text-right">Conversion</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.byBrand.map((b) => (
                                <TableRow key={b.key}>
                                  <TableCell>{b.label}</TableCell>
                                  <TableCell className="text-right">{b.total}</TableCell>
                                  <TableCell className="text-right">{b.counts.sold + b.counts.completed}</TableCell>
                                  <TableCell className="text-right">{b.counts.rejected}</TableCell>
                                  <TableCell className="text-right">{formatPct(b.conversion)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {stats.byCommercial.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Par commercial</h3>
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Commercial</TableHead>
                                <TableHead className="hidden md:table-cell">Marques</TableHead>
                                <TableHead className="text-right">Portefeuille</TableHead>
                                <TableHead className="text-right">Ventes</TableHead>
                                <TableHead className="text-right">Conversion</TableHead>
                                <TableHead className="text-right">Traitées</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.byCommercial.map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell className="max-w-[180px] truncate">{c.email}</TableCell>
                                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{c.brandLabels}</TableCell>
                                  <TableCell className="text-right">{c.total}</TableCell>
                                  <TableCell className="text-right">{c.counts.sold + c.counts.completed}</TableCell>
                                  <TableCell className="text-right">{formatPct(c.conversion)}</TableCell>
                                  <TableCell className="text-right">{c.handled}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Portefeuille = demandes des marques affectées (une marque partagée compte pour chaque compte).
                          « Traitées » = dernier changement de statut fait par le compte, enregistré depuis le 17/11/2026.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {tables.map((tbl) => (
                  <div key={tbl.key} className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {tbl.title} <span className="text-muted-foreground">({tbl.rows.length.toLocaleString("fr-FR")})</span>
                    </h3>
                    {tbl.rows.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucune donnée pour ces filtres.</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {tbl.columns.slice(0, 7).map((c) => (
                                  <TableHead key={c.header} className="whitespace-nowrap">
                                    {c.header}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tbl.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                                <TableRow key={i}>
                                  {r.slice(0, 7).map((v, j) => (
                                    <TableCell key={j} className="max-w-[220px] truncate whitespace-nowrap text-xs">
                                      {v instanceof Date ? formatDateTimeFr(v) : v ?? "—"}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {tbl.rows.length > PREVIEW_ROWS && (
                          <p className="text-xs text-muted-foreground">
                            Aperçu des {PREVIEW_ROWS} premières lignes — l'export contient les {tbl.rows.length.toLocaleString("fr-FR")} lignes et toutes les colonnes.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Exportation ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exportation</CardTitle>
            <CardDescription>
              PDF : rapport mis en page avec indicateurs, graphiques et tableaux. Excel : feuille de synthèse et une feuille filtrable par catégorie.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => runExport("pdf")}
              disabled={!data || stale || exporting !== null}
              className="sm:w-auto"
            >
              {exporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Exporter PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => runExport("xlsx")}
              disabled={!data || stale || exporting !== null}
              className="sm:w-auto"
            >
              {exporting === "xlsx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Exporter Excel
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
