"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/");
        return;
      }

      setUser(data.user);

      fetchBookmarks(data.user.id);

      // ✅ Realtime subscription
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

    // ✅ Proper cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
  };

  const addBookmark = async () => {
    if (!title || !url || !user) return;

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) console.log(error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex justify-center">
      <div className="w-full max-w-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">
            Welcome {user?.email}
          </h2>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Add Bookmark
          </h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 mb-3 outline-none"
          />

          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 mb-4 outline-none"
          />

          <button
            onClick={addBookmark}
            className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg transition"
          >
            Add
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-4">
          Your Bookmarks
        </h3>

        {bookmarks.length === 0 && (
          <p className="text-gray-400">No bookmarks yet</p>
        )}

        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-gray-800 p-4 rounded-lg flex justify-between items-center shadow-md"
            >
              <a
                href={bm.url}
                target="_blank"
                className="text-blue-400 hover:underline"
              >
                {bm.title}
              </a>

              <button
                onClick={() => deleteBookmark(bm.id)}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
