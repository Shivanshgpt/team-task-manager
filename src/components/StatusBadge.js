const STATUS = {
  TODO: { label: "To do", cls: "badge-todo" },
  IN_PROGRESS: { label: "In progress", cls: "badge-inprogress" },
  DONE: { label: "Done", cls: "badge-done" },
};

const PRIORITY = {
  LOW: { label: "Low", cls: "badge-low" },
  MEDIUM: { label: "Medium", cls: "badge-medium" },
  HIGH: { label: "High", cls: "badge-high" },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.TODO;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.MEDIUM;
  return <span className={`badge ${p.cls}`}>{p.label}</span>;
}
