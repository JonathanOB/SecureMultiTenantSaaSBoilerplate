"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { inviteMember, changeMemberRole, removeMember } from "./actions";
import type { ActionResult, OrgRole } from "@/types";

const ROLE_COLORS: Record<OrgRole, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MEMBER: "bg-muted text-muted-foreground",
  VIEWER: "bg-muted text-muted-foreground",
};

type Member = {
  id: string;
  role: OrgRole;
  user: { name: string | null; email: string; avatarUrl: string | null };
};

const initial = { data: null, error: null } as ActionResult<null>;

// ── Invite form ────────────────────────────────────────────────────────────────

export function InviteForm({ canInvite }: { canInvite: boolean }) {
  const [state, action, isPending] = useActionState(inviteMember, initial);

  if (!canInvite) return null;

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="invite-email">Invite by email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="colleague@example.com"
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending} className="shrink-0">
        {isPending ? "Sending…" : "Send invite"}
      </Button>
      {state.error && <p className="text-destructive w-full text-sm">{state.error.message}</p>}
    </form>
  );
}

// ── Member row ─────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  currentMemberId,
  canChangeRole,
  canRemove,
}: {
  member: Member;
  currentMemberId: string;
  canChangeRole: boolean;
  canRemove: boolean;
}) {
  const [roleState, roleAction, roleIsPending] = useActionState(changeMemberRole, initial);
  const [removeState, removeAction, removeIsPending] = useActionState(removeMember, initial);
  const [removeOpen, setRemoveOpen] = useState(false);
  const isSelf = member.id === currentMemberId;

  return (
    <div className="border-border flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
          {(member.user.name ?? member.user.email).slice(0, 2)}
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">
            {member.user.name ?? member.user.email}
            {isSelf && <span className="text-muted-foreground ml-1.5 text-xs">(you)</span>}
          </p>
          <p className="text-muted-foreground text-xs">{member.user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canChangeRole && !isSelf ? (
          <form action={roleAction} id={`role-form-${member.id}`}>
            <input type="hidden" name="memberId" value={member.id} />
            <Select
              name="role"
              defaultValue={member.role}
              disabled={roleIsPending}
              onValueChange={() => {
                const form = document.getElementById(
                  `role-form-${member.id}`
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["OWNER", "ADMIN", "MEMBER", "VIEWER"] as OrgRole[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleState.error && (
              <p className="text-destructive mt-1 text-xs">{roleState.error.message}</p>
            )}
          </form>
        ) : (
          <Badge className={`text-xs ${ROLE_COLORS[member.role]}`} variant="outline">
            {member.role}
          </Badge>
        )}

        {canRemove && !isSelf && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setRemoveOpen(true)}
              disabled={removeIsPending}
            >
              Remove
            </Button>
            <form action={removeAction} id={`remove-form-${member.id}`}>
              <input type="hidden" name="memberId" value={member.id} />
            </form>
            <ConfirmDialog
              open={removeOpen}
              onOpenChange={setRemoveOpen}
              title="Remove member"
              description={`Remove ${member.user.name ?? member.user.email} from this organization?`}
              confirmLabel="Remove"
              destructive
              onConfirm={() => {
                const form = document.getElementById(
                  `remove-form-${member.id}`
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            />
            {removeState.error && (
              <p className="text-destructive mt-1 text-xs">{removeState.error.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Member list ────────────────────────────────────────────────────────────────

export function MemberList({
  members,
  currentMemberId,
  canChangeRole,
  canRemove,
}: {
  members: Member[];
  currentMemberId: string;
  canChangeRole: boolean;
  canRemove: boolean;
}) {
  return (
    <div>
      {members.map((m) => (
        <MemberRow
          key={m.id}
          member={m}
          currentMemberId={currentMemberId}
          canChangeRole={canChangeRole}
          canRemove={canRemove}
        />
      ))}
    </div>
  );
}
