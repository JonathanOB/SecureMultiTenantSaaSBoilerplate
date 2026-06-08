"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { createApiKey, revokeApiKey } from "./actions";
import type { ActionResult } from "@/types";

const initial = { data: null, error: null } as ActionResult<{
  id: string;
  plainKey: string;
} | null>;
const initialRevoke = { data: null, error: null } as ActionResult<null>;

// ── Create form ────────────────────────────────────────────────────────────────

export function CreateKeyForm() {
  const [state, action, isPending] = useActionState(createApiKey, initial);
  const [formOpen, setFormOpen] = useState(false);
  // Track the last dismissed key so we don't re-show the same key after navigating.
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const revealedKey = state.data?.plainKey ?? null;
  const showReveal = !!revealedKey && revealedKey !== dismissedKey;

  function handleClose() {
    setFormOpen(false);
    if (revealedKey) setDismissedKey(revealedKey);
  }

  return (
    <>
      <Button size="sm" onClick={() => setFormOpen(true)}>
        Create API key
      </Button>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Give this key a name and set an expiry.</DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                name="name"
                placeholder="Production key"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key-expires">Expires in</Label>
              <Select name="expiresIn" defaultValue="365">
                <SelectTrigger id="key-expires">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key-scopes">Scopes (comma-separated)</Label>
              <Input id="key-scopes" name="scopes" placeholder="read,write" disabled={isPending} />
            </div>
            {state.error && <p className="text-destructive text-sm">{state.error.message}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating…" : "Create key"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time key reveal dialog */}
      <Dialog
        open={showReveal}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>Copy your key now — it will not be shown again.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all select-all">
            {revealedKey}
          </div>
          <p className="text-muted-foreground text-xs">
            Store this in a secure secrets manager. It will not be recoverable.
          </p>
          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Revoke button ──────────────────────────────────────────────────────────────

export function RevokeKeyButton({ keyId, keyName }: { keyId: string; keyName: string }) {
  const [state, action, isPending] = useActionState(revokeApiKey, initialRevoke);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        Revoke
      </Button>
      <form action={action} id={`revoke-form-${keyId}`}>
        <input type="hidden" name="keyId" value={keyId} />
      </form>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke API key"
        description={`Revoke "${keyName}"? Any applications using it will stop working immediately.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={() => {
          const form = document.getElementById(`revoke-form-${keyId}`) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      {state.error && <p className="text-destructive text-xs">{state.error.message}</p>}
    </>
  );
}
