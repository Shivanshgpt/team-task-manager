import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toaster";
import CommandPalette from "@/components/CommandPalette";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>
        <footer className="px-6 py-5 border-t text-xs text-muted flex items-center justify-between max-w-6xl mx-auto w-full">
          <span>Atelier · Team Task Manager · <span className="kbd">Ctrl + K</span> to search</span>
          <span className="serif italic">{new Date().getFullYear()}</span>
        </footer>
        <CommandPalette isAdmin={user.role === "ADMIN"} />
      </div>
    </ToastProvider>
  );
}
