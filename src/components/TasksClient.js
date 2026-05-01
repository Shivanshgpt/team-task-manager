"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge, { PriorityBadge } from "./StatusBadge";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "DONE", label: "Done" },
  { key: "OVERDUE", label: "Overdue" },
];

export default function TasksClient({ initialTasks, currentUser, mineOnly }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "all") return true;
      if (filter === "OVERDUE") return t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE";
      return t.status === filter;
    });
  }, [tasks, filter, query]);

  async function changeStatus(id, status) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks(tasks.map((t) => (t.id === id ? { ...t, ...task } : t)));
    }
  }

  function toggleMine() {
    const params = new URLSearchParams(sp);
    if (mineOnly) params.delete("mine");
    else params.set("mine", "1");
    router.push(`/tasks${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-8 fade-in">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-1">Workspace</p>
          <h1 className="serif text-4xl">{mineOnly ? "My tasks" : "All tasks"}</h1>
          <p className="mt-2 text-ink-2">{filtered.length} task{filtered.length === 1 ? "" : "s"} shown.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMine} className={`btn ${mineOnly ? "btn-primary" : ""}`}>
            {mineOnly ? "Show all" : "Show only mine"}
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`tab ${filter === f.key ? "tab-active" : ""}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="input max-w-xs"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="serif text-2xl mb-2">Nothing here.</p>
          <p className="text-muted text-sm">Try a different filter, or create a task from inside a project.</p>
        </div>
      ) : (
        <div className="card divide-y">
          {filtered.map((t) => {
            const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
            const canChange = currentUser.role === "ADMIN" || t.assigneeId === currentUser.id;
            return (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-paper-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${t.project.id}`} className="font-medium hover:underline">
                    {t.title}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {t.project.name}
                    {t.assignee ? ` · ${t.assignee.name}` : " · Unassigned"}
                    {t.dueDate && (
                      <span className={overdue ? " text-rose" : ""}>
                        {" · Due "}
                        {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
                {overdue && <span className="badge badge-overdue">Overdue</span>}
                {canChange ? (
                  <select
                    value={t.status}
                    onChange={(e) => changeStatus(t.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border bg-paper-2 outline-none cursor-pointer"
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                ) : (
                  <StatusBadge status={t.status} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
