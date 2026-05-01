"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Users as UsersIcon, X, Pencil } from "lucide-react";
import StatusBadge, { PriorityBadge } from "./StatusBadge";

const COLUMNS = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "DONE", label: "Done" },
];

export default function ProjectDetailClient({ project: initial, allUsers, currentUser, isOwnerOrAdmin }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);

  const grouped = useMemo(() => {
    const g = { TODO: [], IN_PROGRESS: [], DONE: [] };
    project.tasks.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [project.tasks]);

  const memberOptions = useMemo(() => {
    const ids = new Set([project.ownerId, ...project.members.map((m) => m.userId)]);
    return allUsers.filter((u) => ids.has(u.id));
  }, [allUsers, project]);

  async function refresh() {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const { project: fresh } = await res.json();
      setProject(fresh);
    }
  }

  async function createTask(payload) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, projectId: project.id }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Failed to create task");
    }
    setShowTaskModal(false);
    await refresh();
    router.refresh();
  }

  async function updateTask(id, patch) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await refresh();
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  async function updateProject(payload) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Failed to update project");
    }
    setShowEditProject(false);
    await refresh();
    router.refresh();
  }

  async function deleteProject() {
    if (!confirm(`Delete project "${project.name}"? This will remove all its tasks.`)) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) router.push("/projects");
  }

  const teamCount = project.members.length + 1;

  return (
    <div className="space-y-8 fade-in">
      <Link href="/projects" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> All projects
      </Link>

      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-1">Project</p>
          <h1 className="serif text-4xl">{project.name}</h1>
          {project.description && <p className="mt-3 text-ink-2 max-w-2xl">{project.description}</p>}
          <div className="mt-4 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {teamCount} members</span>
            <span>·</span>
            <span>Owner: {project.owner.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New task
          </button>
          {isOwnerOrAdmin && (
            <>
              <button onClick={() => setShowEditProject(true)} className="btn">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button onClick={deleteProject} className="btn btn-danger" title="Delete project">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => (
          <div key={col.key} className="card-soft p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium uppercase tracking-widest text-ink-2">{col.label}</h3>
              <span className="text-xs text-muted">{grouped[col.key].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[col.key].length === 0 && (
                <p className="text-xs text-muted italic px-2 py-3">Nothing here yet.</p>
              )}
              {grouped[col.key].map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  members={memberOptions}
                  currentUser={currentUser}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  onUpdate={(patch) => updateTask(t.id, patch)}
                  onDelete={() => deleteTask(t.id)}
                  onEdit={() => setEditingTask(t)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="serif text-xl mb-3">Team</h3>
        <div className="card divide-y">
          <MemberRow user={project.owner} role="Owner" />
          {project.members.map((m) => (
            <MemberRow key={m.userId} user={m.user} role="Member" />
          ))}
        </div>
      </section>

      {showTaskModal && (
        <TaskModal
          members={memberOptions}
          onClose={() => setShowTaskModal(false)}
          onSave={createTask}
        />
      )}
      {showEditProject && (
        <EditProjectModal
          project={project}
          allUsers={allUsers}
          currentUser={currentUser}
          onClose={() => setShowEditProject(false)}
          onSave={updateProject}
        />
      )}
      {editingTask && (
        <TaskModal
          task={editingTask}
          members={memberOptions}
          onClose={() => setEditingTask(null)}
          onSave={async (payload) => {
            await updateTask(editingTask.id, payload);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

function MemberRow({ user, role }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>
      <span className="badge">{role}</span>
    </div>
  );
}

function TaskCard({ task, members, currentUser, isOwnerOrAdmin, onUpdate, onDelete, onEdit }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const canEditFully = isOwnerOrAdmin;
  const canChangeStatus = canEditFully || task.assigneeId === currentUser.id;

  return (
    <div className="bg-paper rounded-lg border p-3 group">
      <div className="flex items-start justify-between gap-2">
        <button onClick={canEditFully ? onEdit : undefined} className={`text-left flex-1 ${canEditFully ? "hover:underline" : ""}`}>
          <p className="font-medium text-sm leading-snug">{task.title}</p>
        </button>
        {canEditFully && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose transition-opacity">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {task.description && <p className="text-xs text-muted mt-1 line-clamp-2">{task.description}</p>}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {overdue && <span className="badge badge-overdue">Overdue</span>}
        {task.dueDate && (
          <span className="text-xs text-muted">
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t">
        <div className="text-xs text-muted truncate">
          {task.assignee ? task.assignee.name : <span className="italic">Unassigned</span>}
        </div>
        {canChangeStatus ? (
          <select
            value={task.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            className="text-xs px-2 py-1 rounded border bg-paper-2 outline-none cursor-pointer"
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        ) : (
          <StatusBadge status={task.status} />
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, members, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [status, setStatus] = useState(task?.status || "TODO");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave({
        title,
        description,
        priority,
        status,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
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
            <p className="text-muted text-xs uppercase tracking-widest">{task ? "Edit" : "New"}</p>
            <h2 className="serif text-2xl">{task ? "Edit task" : "Create a task"}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select className="select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? "Saving…" : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProjectModal({ project, allUsers, currentUser, onClose, onSave }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const initialMemberIds = project.members.map((m) => m.userId);
  const [memberIds, setMemberIds] = useState(initialMemberIds);
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
      await onSave({ name, description, memberIds });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectableUsers = allUsers.filter((u) => u.id !== project.ownerId);

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-muted text-xs uppercase tracking-widest">Edit</p>
            <h2 className="serif text-2xl">Edit project</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Members</label>
            <p className="text-xs text-muted mb-2">
              Owner ({project.owner.name}) is always a member.
            </p>
            <div className="card-soft p-2 max-h-56 overflow-y-auto">
              {selectableUsers.length === 0 ? (
                <p className="text-xs text-muted p-3">No other users to add yet.</p>
              ) : (
                selectableUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberIds.includes(u.id)}
                      onChange={() => toggle(u.id)}
                      className="accent-ink"
                    />
                    <div className="text-sm flex-1">
                      <p className="font-medium">{u.name} {u.id === currentUser.id && <span className="text-xs text-muted">(you)</span>}</p>
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
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
