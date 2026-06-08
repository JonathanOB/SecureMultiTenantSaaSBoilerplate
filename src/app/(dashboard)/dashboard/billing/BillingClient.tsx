"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { openPortal } from "./actions";
import type { ActionResult } from "@/types";

const initial: ActionResult<null> = { data: null, error: null };

export function BillingClient() {
  const [state, action, isPending] = useActionState(openPortal, initial);

  return (
    <form action={action}>
      <Button variant="outline" size="sm" type="submit" disabled={isPending}>
        {isPending ? "Opening…" : "Manage subscription"}
      </Button>
      {state.error && <p className="text-destructive mt-1 text-xs">{state.error.message}</p>}
    </form>
  );
}
