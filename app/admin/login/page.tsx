import { redirect } from "next/navigation";
import {
  adminAuthConfigured,
  clearAdminSessionCookie,
  isAdminAuthenticated,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

async function login(formData: FormData) {
  "use server";

  if (!adminAuthConfigured()) {
    redirect("/admin/login?error=auth_not_configured");
  }

  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin/ingestion-review");
  const safeNext = nextPath.startsWith("/") ? nextPath : "/admin/ingestion-review";

  const ok = await verifyAdminPassword(password);
  if (!ok) {
    redirect(`/admin/login?error=invalid_password&next=${encodeURIComponent(safeNext)}`);
  }

  await setAdminSessionCookie();
  redirect(safeNext);
}

async function logout() {
  "use server";
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/admin/ingestion-review";
  const loggedIn = await isAdminAuthenticated();
  if (loggedIn) {
    redirect(nextPath);
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-black">Admin Login</h1>
      <p className="text-sm text-black/70">
        Sign in to access ingestion review tools.
      </p>

      {!adminAuthConfigured() ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Admin auth is not configured. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
        </p>
      ) : null}

      {params.error === "invalid_password" ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Invalid password.
        </p>
      ) : null}

      <form action={login} className="space-y-3 rounded border border-black/10 bg-white p-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block space-y-1">
          <span className="text-sm text-black/80">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-black/20 px-2 py-1 text-sm"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded border border-black px-3 py-1.5 text-sm font-medium text-black"
        >
          Sign in
        </button>
      </form>

      <form action={logout}>
        <button
          type="submit"
          className="text-xs text-black/60 underline-offset-4 hover:underline"
        >
          Clear existing admin session
        </button>
      </form>
    </section>
  );
}
