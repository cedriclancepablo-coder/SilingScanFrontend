import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import { getCurrentUser, getRoleLabel, logoutUser } from "@/lib/auth";

export function SidebarUser() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Signed out locally, but the server could not revoke the session: ${error.message}`
          : "Signed out locally, but the server could not revoke the session.",
      );
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
        {user.name.charAt(0).toUpperCase()}
      </div>

      {open && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {getRoleLabel(user.role)}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "Logging out" : "Log out"}
        title={isLoggingOut ? "Logging out..." : "Log out"}
        className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
