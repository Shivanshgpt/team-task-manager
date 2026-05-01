import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>
      <footer className="px-6 py-5 border-t text-xs text-muted flex items-center justify-between max-w-6xl mx-auto w-full">
        <span>Atelier · Team Task Manager</span>
        <span className="serif italic">{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
