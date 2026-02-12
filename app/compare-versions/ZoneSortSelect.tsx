"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export type SortOption =
  | ""
  | "invalid_asc"
  | "invalid_desc"
  | "turnout_asc"
  | "turnout_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "", label: "No sort" },
  { value: "invalid_asc", label: "Invalid % ↑ (low first)" },
  { value: "invalid_desc", label: "Invalid % ↓ (high first)" },
  { value: "turnout_asc", label: "Turnout % ↑ (low first)" },
  { value: "turnout_desc", label: "Turnout % ↓ (high first)" },
];

export type SortVersion = "a" | "b";

export function ZoneSortSelect({
  currentSort,
  currentSortVer,
}: {
  currentSort: SortOption;
  currentSortVer: SortVersion;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onSortChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "__none__") {
      next.delete("sort");
    } else {
      next.set("sort", value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  function onSortVerChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "a" || value === "b") {
      next.set("sortVer", value);
      router.push(`${pathname}?${next.toString()}`);
    }
  }

  const sortTotalChecked = searchParams.get("sortTotal") === "1";

  function onSortTotalChange(nextChecked: boolean | "indeterminate") {
    const next = new URLSearchParams(searchParams);

    if (nextChecked) {
      next.set("sortTotal", "1");
    } else {
      next.delete("sortTotal");
    }

    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentSort || "__none__"}
          onValueChange={onSortChange}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value || "__none__"}
                value={opt.value || "__none__"}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentSort ? (
          <>
            <span className="text-sm text-muted-foreground">using</span>
            <Select value={currentSortVer} onValueChange={onSortVerChange}>
              <SelectTrigger className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">A</SelectItem>
                <SelectItem value="b">B</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={sortTotalChecked}
          onCheckedChange={onSortTotalChange}
        />
        <span>Sort zones by total votes diff (B − A) desc</span>
      </div>
    </div>
  );
}
