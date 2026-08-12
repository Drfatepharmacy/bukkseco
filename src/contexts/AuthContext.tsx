import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { RESET_PASSWORD_PATH } from "@/config/appUrl";

type UserRole = "buyer" | "vendor" | "farmer" | "rider" | "admin";

export type AuthState =
  | "initializing"
  | "anonymous"
  | "authenticated"
  | "recovery"
  | "resolving-role"
  | "error";

const RECOVERY_FLAG = "bukks.auth.recovery";

/** Detects a recovery callback purely from the URL, before any Supabase event fires. */
const urlLooksLikeRecovery = () => {
  if (typeof window === "undefined") return false;
  const { pathname, hash, search } = window.location;
  if (pathname.startsWith(RESET_PASSWORD_PATH)) return true;
  if (pathname.startsWith("/reset-password")) return true;
  if (hash.includes("type=recovery")) return true;
  if (new URLSearchParams(search).get("type") === "recovery") return true;
  return false;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isApproved: boolean;
  loading: boolean;
  authState: AuthState;
  /** True while a password-recovery session is active. Blocks role routing. */
  isRecovery: boolean;
  beginRecovery: () => void;
  endRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isApproved: false,
  loading: true,
  authState: "initializing",
  isRecovery: false,
  beginRecovery: () => {},
  endRecovery: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(
    () =>
      urlLooksLikeRecovery() ||
      (typeof window !== "undefined" && sessionStorage.getItem(RECOVERY_FLAG) === "1")
  );
  const recoveryRef = useRef(isRecovery);
  recoveryRef.current = isRecovery;

  const beginRecovery = () => {
    sessionStorage.setItem(RECOVERY_FLAG, "1");
    recoveryRef.current = true;
    setIsRecovery(true);
  };

  const endRecovery = () => {
    sessionStorage.removeItem(RECOVERY_FLAG);
    recoveryRef.current = false;
    setIsRecovery(false);
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1);

      if (roleData && roleData.length > 0) setRole(roleData[0].role as UserRole);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", userId)
        .single();

      if (profileData) setIsApproved(profileData.is_approved);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // One central auth observer for the whole application.
  useEffect(() => {
    if (urlLooksLikeRecovery()) beginRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        beginRecovery();
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user && !recoveryRef.current) {
        setTimeout(() => fetchUserData(nextSession.user.id), 0);
      } else if (!nextSession) {
        setRole(null);
        setIsApproved(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user && !recoveryRef.current) fetchUserData(existing.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    endRecovery();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsApproved(false);
  };

  const authState: AuthState = loading
    ? "initializing"
    : isRecovery
      ? "recovery"
      : !user
        ? "anonymous"
        : role
          ? "authenticated"
          : "resolving-role";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isApproved,
        loading,
        authState,
        isRecovery,
        beginRecovery,
        endRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
