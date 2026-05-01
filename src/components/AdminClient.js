"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function AdminClient({ users: initial, currentUser }) {
  const [users, setUsers] = useState(initial);
  const [busy, setBusy] = useState("");

  async function setRole(id, role) {
    setBusy(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const { user } = await res.json();
      setUsers(users.map((u) => (u.id === id ? { ...u, ...user } : u)));
    } else {
      const e = await res.json();
      alert(e.error || "Failed");
    }
    setBusy("");
  }

  async function remove(id) {
    if (!confirm("Delete this user? Their owned projects and tasks will be removed too.")) return;
    setBusy(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers(users.filter((u) => u.id !== id));
    setBusy("");
  }

  return (
    <div className="space-y-8 fade-in">
      <header>
        <p className="text-muted text-xs uppercase tracking-widest mb-1">Workspace administration</p>
        <h1 className="serif text-4xl">Members</h1>
        <p className="mt-2 text-ink-2">{users.length} accounts in this workspace.</p>
      </header>

      <div className="card divide-y">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{u.name} {u.id === currentUser.id && <span className="text-xs text-muted">(you)</span>}</p>
              <p className="text-xs text-muted">{u.email}</p>
            </div>
            <span className="text-xs text-muted">
              Joined {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <select
              value={u.role}
              onChange={(e) => setRole(u.id, e.target.value)}
              disabled={busy === u.id || u.id === currentUser.id}
              className="text-xs px-2 py-1 rounded border bg-paper-2 outline-none cursor-pointer"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={() => remove(u.id)}
              disabled={busy === u.id || u.id === currentUser.id}
              className="btn btn-danger p-2"
              title="Remove user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
