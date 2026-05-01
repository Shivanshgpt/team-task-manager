"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutGrid, FolderKanban, ListChecks, Users } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="serif text-xl">Atelier</Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href || pathname?.startsWith(n.href + "/");
              return (
                <Link key={n.href} href={n.href} className={`tab ${active ? "tab-active" : ""} flex items-center gap-2`}>
                  <Icon className="w-3.5 h-3.5" />
                  {n.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`tab ${pathname?.startsWith("/admin") ? "tab-active" : ""} flex items-center gap-2`}
              >
                <Users className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm leading-tight">{user.name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          {user.role === "ADMIN" && <span className="badge badge-admin">Admin</span>}
          <button onClick={logout} className="btn btn-ghost" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
