import { AlertCircle, Info } from "lucide-react";
import type { ReactNode } from "react";

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "danger";
  children: ReactNode;
}) {
  return (
    <div className={`notice ${kind === "danger" ? "notice-danger" : "notice-info"}`}>
      {kind === "danger" ? <AlertCircle size={16} /> : <Info size={16} />}
      <div>{children}</div>
    </div>
  );
}
