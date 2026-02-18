"use client";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <button
        onClick={login}
        className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-80 transition"
      >
        Continue with Google
      </button>
    </div>
  );
}
