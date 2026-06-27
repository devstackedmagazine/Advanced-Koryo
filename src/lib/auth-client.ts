import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
}

export async function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function useAuthSession() {
  // simple imperative getter — components can re-read on auth events
  return supabase.auth.getSession();
}
