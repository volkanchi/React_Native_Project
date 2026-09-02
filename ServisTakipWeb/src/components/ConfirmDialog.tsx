import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Sil",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }}>
          <AlertTriangle size={20} />
        </div>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
          {description}
        </p>
      </div>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
          Vazgeç
        </button>
        <button className="btn btn-danger" onClick={handleConfirm} disabled={submitting}>
          {submitting ? <span className="spinner" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
