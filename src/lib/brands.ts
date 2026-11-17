import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { queryKeys } from "@/lib/queryKeys";

// Brand catalogue. The source of truth is the public.brands table; `code` is
// the value stored in every car_brand column (and sent by the website), `label`
// is what the dashboard shows. Inactive brands (e.g. FORD) stay readable for
// history but are never offered for new assignments or edits.

export interface BrandInfo {
  code: string;
  label: string;
  active: boolean;
  sort_order: number;
}

// Used until the table loads, or if it cannot be read.
export const DEFAULT_BRANDS: BrandInfo[] = [
  { code: "BYD", label: "BYD", active: true, sort_order: 10 },
  { code: "CHERY", label: "CHERY", active: true, sort_order: 20 },
  { code: "CHEVROLET", label: "CHEVROLET", active: true, sort_order: 30 },
  { code: "DACIA", label: "DACIA", active: true, sort_order: 40 },
  { code: "DFSK", label: "DFSK", active: true, sort_order: 50 },
  { code: "DONGFENG", label: "DONGFENG", active: true, sort_order: 60 },
  { code: "GAC", label: "GAC MOTOR", active: true, sort_order: 70 },
  { code: "GREAT WALL", label: "GREAT WALL (GWM)", active: true, sort_order: 80 },
  { code: "HAVAL", label: "HAVAL", active: true, sort_order: 90 },
  { code: "ISUZU", label: "ISUZU", active: true, sort_order: 100 },
  { code: "MG", label: "MG", active: true, sort_order: 110 },
  { code: "NISSAN", label: "NISSAN", active: true, sort_order: 120 },
  { code: "OMODA & JAECOO", label: "OMODA & JAECOO", active: true, sort_order: 130 },
  { code: "RENAULT", label: "RENAULT", active: true, sort_order: 140 },
  { code: "SUZUKI", label: "SUZUKI", active: true, sort_order: 150 },
  { code: "TOYOTA", label: "TOYOTA", active: true, sort_order: 160 },
  { code: "FORD", label: "FORD", active: false, sort_order: 900 },
];

const DEFAULT_LABELS = new Map(DEFAULT_BRANDS.map((b) => [b.code, b.label]));

export function useBrands() {
  const query = useQuery<BrandInfo[]>({
    queryKey: queryKeys.brands.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("code, label, active, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as BrandInfo[];
    },
    staleTime: 60 * 60_000,
  });

  const all = query.data && query.data.length > 0 ? query.data : DEFAULT_BRANDS;
  const labels = new Map(all.map((b) => [b.code, b.label]));

  return {
    brands: all,
    activeBrands: all.filter((b) => b.active),
    labelOf: (code: string | null | undefined) =>
      code ? labels.get(code) ?? DEFAULT_LABELS.get(code) ?? code : "—",
  };
}

/** Label without the hook (for exports and non-React code). */
export function brandLabel(code: string | null | undefined, brands: BrandInfo[] = DEFAULT_BRANDS): string {
  if (!code) return "Sans marque";
  return brands.find((b) => b.code === code)?.label ?? DEFAULT_LABELS.get(code) ?? code;
}

/**
 * Brand options for a filter: the brands a user may see, plus any historical
 * brand present in the loaded data (so old FORD records stay filterable).
 */
export function filterBrandOptions(
  brands: BrandInfo[],
  opts: { role?: string; userBrands?: string[]; dataBrands?: (string | null | undefined)[] }
): BrandInfo[] {
  if (opts.role === "sales") {
    const mine = new Set(opts.userBrands ?? []);
    return brands.filter((b) => mine.has(b.code));
  }
  const present = new Set((opts.dataBrands ?? []).filter(Boolean) as string[]);
  const list = brands.filter((b) => b.active || present.has(b.code));
  for (const code of present) {
    if (!list.some((b) => b.code === code)) {
      list.push({ code, label: code, active: false, sort_order: 999 });
    }
  }
  return list;
}
