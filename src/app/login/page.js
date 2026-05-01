import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Sign in — Atelier" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex flex-col justify-between p-12 bg-paper-2 border-r">
        <Link href="/" className="serif text-xl">Atelier</Link>
        <div>
          <p className="serif text-4xl leading-tight">
            "The best teams are quiet, deliberate, and shipping."
          </p>
          <p className="mt-6 text-sm text-muted uppercase tracking-widest">— Notes from the studio</p>
        </div>
        <p className="text-xs text-muted">Issue 01 · Spring</p>
      </aside>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-in">
          <p className="text-muted text-xs uppercase tracking-widest mb-3">Welcome back</p>
          <h1 className="serif text-3xl mb-8">Sign in to your workspace</h1>
          <AuthForm mode="login" />
          <p className="mt-6 text-sm text-ink-2">
            New here?{" "}
            <Link href="/signup" className="text-ink underline">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
