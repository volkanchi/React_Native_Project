export function LoadingBlock({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "50px 0", justifyContent: "center", color: "var(--text-muted)", fontSize: 13.5 }}>
      <span className="spinner" />
      {label}
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <div className="center-screen">
      <span className="spinner" />
      Yükleniyor...
    </div>
  );
}
