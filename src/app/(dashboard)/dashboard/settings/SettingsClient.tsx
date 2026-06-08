"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgSettings, deleteOrganization } from "./actions";
import type { ActionResult } from "@/types";

const initial: ActionResult<null> = { data: null, error: null };

type OrgFormProps = {
  orgName: string;
  orgSlug: string;
  orgLogoUrl: string | null;
};

export function OrgSettingsForm({ orgName, orgSlug, orgLogoUrl }: OrgFormProps) {
  const [state, action, isPending] = useActionState(updateOrgSettings, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={orgName}
          required
          minLength={2}
          maxLength={100}
          disabled={isPending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slug">URL slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">app/</span>
          <Input
            id="slug"
            name="slug"
            defaultValue={orgSlug}
            required
            minLength={2}
            maxLength={63}
            pattern="[a-z0-9-]+"
            disabled={isPending}
            className="lowercase"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logoUrl">Logo URL (optional)</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={orgLogoUrl ?? ""}
          disabled={isPending}
          placeholder="https://example.com/logo.png"
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error.message}</p>}
      {state.data !== undefined && !state.error && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

// ── Danger zone ────────────────────────────────────────────────────────────────

export function DangerZone({ orgName }: { orgName: string }) {
  const [state, action, isPending] = useActionState(deleteOrganization, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-destructive/30 rounded-lg border p-4">
      <h3 className="text-destructive mb-1 text-sm font-semibold">Delete organization</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        This permanently deletes <strong>{orgName}</strong> and all associated data. This action
        cannot be undone.
      </p>
      <form action={action} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="confirmName" className="text-sm">
            Type <strong>{orgName}</strong> to confirm
          </Label>
          <Input
            id="confirmName"
            name="confirmName"
            ref={inputRef}
            placeholder={orgName}
            required
            disabled={isPending}
            className="border-destructive/50 max-w-xs"
          />
        </div>
        {state.error && <p className="text-destructive text-sm">{state.error.message}</p>}
        <Button type="submit" variant="destructive" disabled={isPending} size="sm">
          {isPending ? "Deleting…" : "Delete organization"}
        </Button>
      </form>
    </div>
  );
}
