import { Progress } from "@/components/ui/progress";

type UsageBarProps = {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  className?: string;
};

export function UsageBar({ label, current, limit, unit = "", className }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current}
          {unit} / {limit}
          {unit}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        style={
          isAtLimit
            ? ({ "--progress-bg": "var(--destructive)" } as React.CSSProperties)
            : isNearLimit
              ? ({ "--progress-bg": "var(--accent)" } as React.CSSProperties)
              : undefined
        }
      />
      {isAtLimit && <p className="text-destructive text-xs">Limit reached</p>}
    </div>
  );
}
