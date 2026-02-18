"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark, LogOut, User, Menu, X, Search, Settings, Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface UserType {
    id: string;
    email?: string;
}

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<UserType | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const searchQuery = searchParams.get("q") || "";

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        setIsOpen(false);
        setIsProfileOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="mx-auto max-w-7xl">
                <div className="glass-card flex items-center justify-between rounded-2xl px-6 py-3">
                    <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-500/20 p-1.5 ring-1 ring-blue-500/30">
                            <Bookmark className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">SmartMark</span>
                    </Link>

                    {/* Desktop Nav Actions */}
                    <div className="hidden items-center gap-4 md:flex">
                        {/* Navbar Search - Only on Dashboard */}
                        {pathname === "/dashboard" && (
                            <div className="hidden max-w-[240px] md:block">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full rounded-xl bg-white/[0.03] border border-white/10 py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-gray-500 outline-none focus:bg-white/[0.06] focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 rounded-full bg-white/5 p-1 ring-1 ring-white/10 transition-all hover:bg-white/10"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsProfileOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B] p-2 shadow-2xl ring-1 ring-black/50"
                                            >
                                                <div className="px-4 py-3">
                                                    <p className="text-sm font-bold text-white truncate">{user.email}</p>
                                                </div>

                                                <div className="my-1 h-[1px] bg-white/5" />

                                                <div className="p-1">
                                                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 transition-all hover:bg-white/5 hover:text-white">
                                                        <Settings className="h-4 w-4" />
                                                        Edit profile
                                                    </button>
                                                </div>

                                                <div className="my-1 h-[1px] bg-white/5" />

                                                <div className="px-4 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Theme</p>
                                                    <div className="mt-2 space-y-1">
                                                        {[
                                                            { id: 'dark', icon: Moon, label: 'Dark' },
                                                            { id: 'light', icon: Sun, label: 'Light' },
                                                            { id: 'system', icon: Monitor, label: 'System' }
                                                        ].map((t) => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setTheme(t.id as "dark" | "light" | "system")}
                                                                className={cn(
                                                                    "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all",
                                                                    theme === t.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                                                                )}
                                                            >
                                                                <t.icon className="h-3.5 w-3.5" />
                                                                {t.label}
                                                                {theme === t.id && <div className="ml-auto h-1 w-1 rounded-full bg-blue-500" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="my-1 h-[1px] bg-white/5" />

                                                <div className="p-1">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Log out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="block text-gray-400 hover:text-white md:hidden"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Nav Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 block md:hidden"
                        >
                            <div className="glass-card flex flex-col gap-4 rounded-2xl p-6">
                                {user ? (
                                    <>
                                        <div className="px-2">
                                            <p className="text-xs font-bold text-white truncate">{user.email}</p>
                                        </div>
                                        <div className="h-[1px] w-full bg-white/10" />
                                        <button className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white">
                                            <Settings className="h-4 w-4" />
                                            Edit profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/auth"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
