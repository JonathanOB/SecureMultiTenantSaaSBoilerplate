"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { exportAuditLogCsv } from "./actions";
import type { ActionResult } from "@/types";
import { useEffect } from "react";

const initial = { data: null, error: null } as unknown as ActionResult<string>;

export function CsvExportButton() {
  const [state, action, isPending] = useActionState(exportAuditLogCsv, initial);

  useEffect(() => {
    if (!state.data) return;
    const blob = new Blob([state.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.data]);

  return (
    <form action={action}>
      <Button variant="outline" size="sm" type="submit" disabled={isPending}>
        {isPending ? "Exporting…" : "Export CSV"}
      </Button>
      {state.error && <p className="text-destructive mt-1 text-xs">{state.error.message}</p>}
    </form>
  );
}
