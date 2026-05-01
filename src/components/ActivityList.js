import { Activity } from "lucide-react";

function relativeTime(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildProjectActivity(project) {
  const events = [
    {
      type: "project_created",
      at: project.createdAt,
      text: `Project ${project.name} created`,
      who: project.owner?.name,
    },
  ];
  for (const t of project.tasks) {
    events.push({
      type: "task_created",
      at: t.createdAt,
      text: `created “${t.title}”`,
      who: t.createdBy?.name,
    });
    if (t.updatedAt && new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() > 1000) {
      events.push({
        type: "task_updated",
        at: t.updatedAt,
        text: `updated “${t.title}” → ${t.status.replace("_", " ").toLowerCase()}`,
        who: t.assignee?.name,
      });
    }
  }
  return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
}

export default function ActivityList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-muted">
        <Activity className="w-5 h-5 mx-auto mb-2 opacity-60" />
        Nothing has happened yet.
      </div>
    );
  }
  return (
    <div className="card divide-y">
      {items.map((e, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <div className="pt-1.5">
            <span
              className="block w-2 h-2 rounded-full"
              style={{
                background:
                  e.type === "task_updated" ? "var(--color-amber)" :
                  e.type === "project_created" ? "var(--color-muted)" :
                  "var(--color-accent)",
                boxShadow:
                  e.type === "task_updated" ? "0 0 0 4px #fdf3df" :
                  e.type === "project_created" ? "0 0 0 4px var(--color-paper-2)" :
                  "0 0 0 4px var(--color-accent-soft)",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">{relativeTime(e.at)}</p>
            <p className="text-sm">
              {e.who && <span className="font-medium">{e.who} </span>}
              <span className="text-ink-2">{e.text}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
