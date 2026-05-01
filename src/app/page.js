import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="serif text-xl font-medium">Atelier</span>
          <span className="text-muted text-xs uppercase tracking-widest">/ Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="flex-1 px-8 pt-16 pb-24 max-w-5xl mx-auto w-full fade-in">
        <p className="text-muted text-xs uppercase tracking-widest mb-6">Issue No. 01 — A Team Task Manager</p>
        <h1 className="serif text-5xl md:text-7xl leading-[1.05] tracking-tight">
          Quiet software for <em className="text-accent">teams</em> that ship.
        </h1>
        <p className="mt-6 text-lg text-ink-2 max-w-2xl leading-relaxed">
          Atelier is a calm, considered task manager. Create projects, assign work, track progress —
          without the noise of dashboards designed to look busy.
        </p>
        <div className="mt-10 flex items-center gap-3 flex-wrap">
          <Link href="/signup" className="btn btn-accent">Create your workspace →</Link>
          <Link href="/login" className="btn">I already have an account</Link>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Projects with intent", d: "Group work into projects. Invite the people who need to be there. Nothing more." },
            { n: "02", t: "Tasks that move", d: "To do, in progress, done. Priority, due dates — overdue items surface themselves." },
            { n: "03", t: "Roles that matter", d: "Admins manage the workspace. Members focus on what's theirs. RBAC enforced server-side." },
          ].map((f) => (
            <div key={f.n} className="card p-6">
              <p className="text-muted text-xs tracking-widest mb-3">{f.n}</p>
              <h3 className="serif text-xl mb-2">{f.t}</h3>
              <p className="text-ink-2 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-8 py-6 border-t flex items-center justify-between text-sm text-muted">
        <span>© Atelier — built for the assignment</span>
        <span className="serif italic">Made with care.</span>
      </footer>
    </main>
  );
}
