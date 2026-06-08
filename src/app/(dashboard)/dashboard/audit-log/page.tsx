import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvExportButton } from "./AuditClient";
import { appConfig } from "@/config/app.config";
import type { OrgRole } from "@/types";

export const metadata: Metadata = { title: "Audit Log" };

const PAGE_SIZE = 25;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const membership = await prisma.organizationMembership.findFirst({
    where: { orgId, user: { clerkId: userId } },
  });
  if (!membership) redirect("/sign-in");

  const role = membership.role as OrgRole;
  if (!hasPermission(role, "auditlog:read")) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-8 text-center">
        You do not have permission to view the audit log.
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt((params["page"] as string | undefined) ?? "1", 10));
  const action = (params["action"] as string | undefined) ?? "";
  const userId2 = (params["userId"] as string | undefined) ?? "";

  const where = {
    orgId,
    ...(action ? { action: { contains: action } } : {}),
    ...(userId2 ? { userId: userId2 } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            A record of all actions taken in your organization.
          </p>
        </div>
        <CsvExportButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total} event{total !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border text-muted-foreground border-b text-left text-xs">
                      <th className="pr-4 pb-2 font-medium">Actor</th>
                      <th className="pr-4 pb-2 font-medium">Action</th>
                      <th className="pr-4 pb-2 font-medium">Resource</th>
                      <th className="pr-4 pb-2 font-medium">IP</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="text-xs">
                        <td className="text-foreground py-2.5 pr-4">
                          {log.user.name ?? log.user.email}
                        </td>
                        <td className="text-muted-foreground py-2.5 pr-4 font-mono">
                          {log.action}
                        </td>
                        <td className="text-muted-foreground py-2.5 pr-4">
                          {log.resource ?? "—"}
                          {log.resourceId && (
                            <span className="text-muted-foreground/60 ml-1">
                              #{log.resourceId.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground py-2.5 pr-4 font-mono">
                          {log.ipAddress ?? "—"}
                        </td>
                        <td className="text-muted-foreground py-2.5 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString(appConfig.locale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`?page=${page - 1}${action ? `&action=${action}` : ""}`}
                        className="text-primary hover:underline"
                      >
                        Previous
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`?page=${page + 1}${action ? `&action=${action}` : ""}`}
                        className="text-primary hover:underline"
                      >
                        Next
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
