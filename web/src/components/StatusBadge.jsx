const LABELS = {
  ok: "Normal",
  low: "Estoque baixo",
  negative: "Negativo",
};

const CLASSES = {
  ok: "badge-ok",
  low: "badge-low",
  negative: "badge-negative",
};

export function StatusBadge({ status }) {
  return <span className={`badge ${CLASSES[status] || "badge-ok"}`}>{LABELS[status] || status}</span>;
}
