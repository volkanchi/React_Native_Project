import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint: "accent" | "info" | "success";
}) {
  const bg =
    tint === "accent" ? "#fdf0da" : tint === "info" ? "var(--info-soft)" : "var(--success-soft)";
  const fg = tint === "accent" ? "var(--accent-ink)" : tint === "info" ? "var(--info)" : "var(--success)";

  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color: fg }}>
        <Icon size={16} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
