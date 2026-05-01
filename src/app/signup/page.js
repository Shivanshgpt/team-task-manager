import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Sign up — Atelier" };

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex flex-col justify-between p-12 bg-paper-2 border-r">
        <Link href="/" className="serif text-xl">Atelier</Link>
        <div>
          <p className="serif text-4xl leading-tight">
            "Less noise. More shipped."
          </p>
          <p className="mt-6 text-sm text-muted uppercase tracking-widest">— Notes from the studio</p>
        </div>
        <p className="text-xs text-muted">Issue 01 · Spring</p>
      </aside>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-in">
          <p className="text-muted text-xs uppercase tracking-widest mb-3">Begin</p>
          <h1 className="serif text-3xl mb-2">Create your workspace</h1>
          <p className="text-sm text-muted mb-8">First account becomes the workspace administrator.</p>
          <AuthForm mode="signup" />
          <p className="mt-6 text-sm text-ink-2">
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
