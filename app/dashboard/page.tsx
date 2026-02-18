export const dynamic = "force-dynamic";

"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/* ---------------- TYPES ---------------- */

interface User {
  id: string;
  email?: string;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}

/* ---------------- MAIN CONTENT ---------------- */

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH BOOKMARKS ---------------- */

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data as BookmarkItem[]);
  };

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/");
        return;
      }

      setUser(data.user as User);
      await fetchBookmarks(data.user.id);
      setLoading(false);

      // Realtime subscription
      channel = supabase
        .channel("bookmarks-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${data.user.id}`,
          },
          () => {
            fetchBookmarks(data.user.id);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  /* ---------------- ADD BOOKMARK ---------------- */

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user) return;

    const finalUrl = url.startsWith("http") ? url : `https://${url}`;

    await supabase.from("bookmarks").insert({
      title,
      url: finalUrl,
      user_id: user.id,
    });

    setTitle("");
    setUrl("");
  };

  /* ---------------- DELETE BOOKMARK ---------------- */

  const deleteBookmark = async (id: string) => {
    if (!user) return;

    await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  };

  /* ---------------- FILTER ---------------- */

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(
      (bm) =>
        bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookmarks, searchQuery]);

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 text-white">
      <h1 className="text-2xl font-bold mb-6">My Bookmarks</h1>

      <form onSubmit={addBookmark} className="mb-8 space-y-4">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 outline-none"
          required
        />

        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 outline-none"
          required
        />

        <button className="bg-blue-600 px-6 py-2 rounded-xl">
          Add Bookmark
        </button>
      </form>

      <div className="space-y-4">
        {filteredBookmarks.length === 0 ? (
          <p className="text-gray-400">No bookmarks found</p>
        ) : (
          filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="flex items-center justify-between bg-gray-800 p-4 rounded-xl"
            >
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400"
              >
                {bm.title}
              </a>

              <button
                onClick={() => deleteBookmark(bm.id)}
                className="text-red-400"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- SUSPENSE WRAPPER ---------------- */

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
