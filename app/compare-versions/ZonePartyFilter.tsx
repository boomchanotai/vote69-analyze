"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PartyOption = { party_id: string; party: string };

export function ZonePartyFilter({
  parties,
  currentPartyId,
}: {
  parties: PartyOption[];
  currentPartyId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onValueChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "__all__" || !value) {
      next.delete("party");
    } else {
      next.set("party", value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={currentPartyId ?? "__all__"} onValueChange={onValueChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="All zones" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All zones</SelectItem>
        {parties.map((p) => (
          <SelectItem key={p.party_id} value={p.party_id}>
            {p.party_id} {p.party} (rank 1 only)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
