"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, FolderKanban, ListChecks, Plus, Search, Users } from "lucide-react";

export default function CommandPalette({ isAdmin }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      fetch("/api/projects")
        .then((r) => r.ok ? r.json() : { projects: [] })
        .then((d) => setProjects(d.projects || []));
    }
  }, [open]);

  const items = useMemo(() => {
    const nav = [
      { kind: "nav", label: "Go to Dashboard", href: "/dashboard", icon: LayoutGrid, group: "Navigation" },
      { kind: "nav", label: "Go to Projects", href: "/projects", icon: FolderKanban, group: "Navigation" },
      { kind: "nav", label: "Go to Tasks", href: "/tasks", icon: ListChecks, group: "Navigation" },
      { kind: "nav", label: "My Tasks", href: "/tasks?mine=1", icon: ListChecks, group: "Navigation" },
      ...(isAdmin ? [{ kind: "nav", label: "Admin · Manage members", href: "/admin", icon: Users, group: "Navigation" }] : []),
      { kind: "nav", label: "+ New project", href: "/projects?new=1", icon: Plus, group: "Actions" },
    ];
    const projItems = projects.map((p) => ({
      kind: "project",
      label: p.name,
      href: `/projects/${p.id}`,
      icon: FolderKanban,
      group: "Projects",
    }));
    const all = [...nav, ...projItems];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((i) => i.label.toLowerCase().includes(q));
  }, [projects, query, isAdmin]);

  useEffect(() => { setActive(0); }, [query]);

  function go(item) {
    setOpen(false);
    router.push(item.href);
  }

  function onInputKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
  }

  if (!open) return null;

  let lastGroup = null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/40 flex items-start justify-center pt-[12vh] px-4 fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Search className="w-4 h-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent outline-none text-base"
          />
          <span className="text-xs text-muted kbd">Esc</span>
        </div>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-muted px-3 py-6 text-center">No results.</p>
          )}
          {items.map((item, i) => {
            const Icon = item.icon;
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={`${item.kind}-${item.href}-${i}`}>
                {showGroup && (
                  <p className="text-[10px] uppercase tracking-widest text-muted px-3 pt-3 pb-1">{item.group}</p>
                )}
                <button
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
                    active === i ? "bg-paper-2" : ""
                  }`}
                >
                  <Icon className="w-4 h-4 text-muted" />
                  <span className="flex-1">{item.label}</span>
                  {active === i && <span className="text-xs text-muted kbd">↵</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
