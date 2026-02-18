"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Inbox
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data as BookmarkItem[]);
  };

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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user) return;

    setAdding(true);
    let finalUrl = url;
    if (!url.startsWith("http")) {
      finalUrl = `https://${url}`;
    }

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url: finalUrl,
      user_id: user.id,
    });

    if (!error) {
      setTitle("");
      setUrl("");
      await fetchBookmarks(user.id);
    }
    setAdding(false);
  };

  const deleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((bm) => bm.id !== id));
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bm =>
      bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookmarks, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card relative w-full max-w-md overflow-hidden rounded-3xl"
            >
              <form onSubmit={async (e) => {
                await addBookmark(e);
                setIsModalOpen(false);
              }} className="p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Save a new link</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Website Name</label>
                    <input
                      placeholder="My Favorite Tool"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="glass-input w-full rounded-2xl px-5 py-3.5 text-sm outline-none placeholder:text-gray-600 text-white"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">URL</label>
                    <input
                      placeholder="google.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="glass-input w-full rounded-2xl px-5 py-3.5 text-sm outline-none placeholder:text-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adding}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Bookmark"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <header>
            <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">My Collection</h1>
            <p className="text-sm text-gray-400 italic">Curating your digital universe</p>
          </header>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            Add New Link
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredBookmarks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.02] ring-1 ring-white/10">
                  <Inbox className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-400">
                  {searchQuery ? "No matches found" : "Your collection is empty"}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {searchQuery ? "Try a different keyword" : "Click 'Add New' to save your first link"}
                </p>
              </motion.div>
            ) : (
              filteredBookmarks.map((bm) => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  onDelete={() => deleteBookmark(bm.id)}
                  onCopy={() => copyToClipboard(bm.id, bm.url)}
                  isCopied={copiedId === bm.id}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function BookmarkCard({
  bookmark,
  onDelete,
  onCopy,
  isCopied
}: {
  bookmark: BookmarkItem;
  onDelete: () => void;
  onCopy: () => void;
  isCopied: boolean;
}) {
  const domain = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname;
    } catch {
      return bookmark.url;
    }
  }, [bookmark.url]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="glass-card flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/[0.04]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${domain}`;
            }}
          />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-white">
            {bookmark.title}
          </h4>
          <p className="truncate text-xs text-gray-500">
            {domain}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onCopy}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isCopied ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
          title="Copy URL"
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white rounded-lg"
          title="Open Link"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500 rounded-lg"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
