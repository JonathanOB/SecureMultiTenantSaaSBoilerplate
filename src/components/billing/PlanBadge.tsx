import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app.config";

type PlanBadgeProps = {
  planId: string;
  className?: string;
};

export function PlanBadge({ planId, className }: PlanBadgeProps) {
  const plan = appConfig.billing.plans.find((p) => p.id === planId);
  const name = plan?.name ?? planId;
  const isFree = planId === "free";

  return (
    <Badge
      variant={isFree ? "secondary" : "default"}
      className={className}
      style={!isFree ? { backgroundColor: appConfig.theme.colors.primary } : undefined}
    >
      {name}
    </Badge>
  );
}
