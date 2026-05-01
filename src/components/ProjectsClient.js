"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FolderKanban, Users as UsersIcon, ListChecks, X } from "lucide-react";
import { useToast } from "./Toaster";
import AvatarStack from "./AvatarStack";

export default function ProjectsClient({ initialProjects, users, currentUser }) {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [showModal, setShowModal] = useState(false);

  async function onCreate(payload) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Failed to create project");
    }
    const { project } = await res.json();
    setProjects([{ ...project, _count: { tasks: 0 } }, ...projects]);
    setShowModal(false);
    toast("success", "Project created", `“${project.name}” is ready.`);
    router.refresh();
  }

  return (
    <div className="space-y-8 fade-in">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-1">Workspace</p>
          <h1 className="serif text-4xl">Projects</h1>
          <p className="mt-2 text-ink-2">
            {projects.length} {projects.length === 1 ? "project" : "projects"} you have access to.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> New project
        </button>
      </header>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban className="w-10 h-10 mx-auto mb-4 text-muted" />
          <p className="serif text-2xl mb-2">No projects yet</p>
          <p className="text-muted text-sm mb-6">Create your first project to start organising work.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-accent">
            <Plus className="w-4 h-4" /> New project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const total = p._count?.tasks ?? 0;
            const percent = p._percent ?? 0;
            const memberList = [{ id: p.owner.id, name: p.owner.name }, ...(p.members ?? []).map((m) => ({ id: m.user.id, name: m.user.name }))];
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="card p-6 hover:bg-paper-2 transition-colors flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted text-xs uppercase tracking-widest">Project</span>
                  <span className="text-xs text-muted">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <h2 className="serif text-2xl mb-2">{p.name}</h2>
                <p className="text-sm text-ink-2 line-clamp-2 min-h-[2.5rem]">{p.description || "No description."}</p>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                    <span>{total === 0 ? "No tasks yet" : `${p._doneCount ?? 0} of ${total} done`}</span>
                    <span className="tabular-nums font-medium text-ink-2">{percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-muted">
                  <AvatarStack people={memberList} />
                  <span className="flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" /> {total} {total === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateProjectModal users={users} currentUser={currentUser} onClose={() => setShowModal(false)} onCreate={onCreate} />
      )}
    </div>
  );
}

function CreateProjectModal({ users, currentUser, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(id) {
    setMemberIds((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onCreate({ name, description, memberIds });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-muted text-xs uppercase tracking-widest">New</p>
            <h2 className="serif text-2xl">Create a project</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Q3 Launch Plan" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
            />
          </div>
          <div>
            <label className="label">Add members</label>
            <div className="card-soft p-2 max-h-48 overflow-y-auto">
              {users.filter((u) => u.id !== currentUser.id).length === 0 ? (
                <p className="text-xs text-muted p-3">No other users yet. Invite them via signup.</p>
              ) : (
                users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={memberIds.includes(u.id)}
                        onChange={() => toggle(u.id)}
                        className="accent-ink"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </label>
                  ))
              )}
            </div>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
