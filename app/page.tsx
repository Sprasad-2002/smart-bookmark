"use client";

import { motion } from "framer-motion";
import { Bookmark, Globe, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      {/* Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
            <Bookmark className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
          Your Smart <span className="text-blue-500">Bookmarks</span>,
          Enhanced.
        </h1>

        <p className="mb-10 text-lg text-gray-400 sm:text-xl">
          The most elegant way to save, organize, and sync your favorite corners of the internet.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push("/auth")}
            className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:pr-10 active:scale-95"
          >
            Get Started
            <span className="absolute right-4 opacity-0 transition-all group-hover:opacity-100 group-hover:right-6">
              →
            </span>
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureItem
            icon={<Zap className="h-6 w-6 text-yellow-500" />}
            title="Lightning Fast"
            desc="Real-time sync across all your devices instantly."
          />
          <FeatureItem
            icon={<Globe className="h-6 w-6 text-blue-500" />}
            title="Access Anywhere"
            desc="Your bookmarks are safe and available on the cloud."
          />
          <FeatureItem
            icon={<Shield className="h-6 w-6 text-green-500" />}
            title="Secure"
            desc="Protected by enterprise-grade security."
          />
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass-card rounded-2xl p-6 text-left">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
