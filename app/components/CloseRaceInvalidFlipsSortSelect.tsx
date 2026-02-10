"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortInvalidOrder = "asc" | "desc" | "";

export function CloseRaceInvalidFlipsSortSelect({
  currentSort,
}: {
  currentSort: SortInvalidOrder;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onValueChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "__none__") {
      next.delete("sortInvalid");
    } else {
      next.set("sortInvalid", value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select
      value={currentSort || "__none__"}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sort by invalid..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">No sort</SelectItem>
        <SelectItem value="asc">Invalid votes ↑ (low first)</SelectItem>
        <SelectItem value="desc">Invalid votes ↓ (high first)</SelectItem>
      </SelectContent>
    </Select>
  );
}
