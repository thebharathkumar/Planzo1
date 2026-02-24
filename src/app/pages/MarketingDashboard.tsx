import React, { useState } from "react";
import { Megaphone, Star, Send, TrendingUp, Plus, X, Mail, Bell } from "lucide-react";
import { MOCK_EVENTS, MOCK_CAMPAIGNS } from "../mock-data";

export function MarketingDashboard() {
    const [showCreate, setShowCreate] = useState(false);
    const [tab, setTab] = useState<"featured" | "campaigns">("featured");
    const featuredEvents = MOCK_EVENTS.filter((e) => e.featured);

    const campaignTypeIcon = (type: string) => {
        if (type === "email") return <Mail size={12} />;
        if (type === "push") return <Bell size={12} />;
        return <Star size={12} />;
    };
    const typeColor = (type: string) => {
        if (type === "email") return { bg: "rgba(96,165,250,0.1)", color: "#2563eb" };
        if (type === "push") return { bg: "rgba(192,132,252,0.1)", color: "#7c3aed" };
        return { bg: "rgba(251,191,36,0.1)", color: "#d97706" };
    };

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Marketing Hub</h1>
                        <p className="text-sm" style={{ color: "#78716c" }}>Manage featured listings, campaigns, and promotions</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                        <Plus size={15} /> New Campaign
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Active Campaigns", value: MOCK_CAMPAIGNS.filter(c => c.status === "active").length, color: "#f97316" },
                        { label: "Total Emails Sent", value: "16.7K", color: "#2563eb" },
                        { label: "Avg Open Rate", value: "39%", color: "#7c3aed" },
                        { label: "Campaign Revenue", value: "$63.5K", color: "#d97706" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <p className="text-2xl font-bold mb-1" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                            <p className="text-xs" style={{ color: "#78716c" }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(["featured", "campaigns"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all" style={{ background: tab === t ? "#f97316" : "rgba(249,115,22,0.06)", color: tab === t ? "#fff8f4" : "#92400e", border: `1px solid ${tab === t ? "#f97316" : "rgba(249,115,22,0.18)"}` }}>
                            {t === "featured" ? "⭐ Featured Events" : "📊 Campaigns"}
                        </button>
                    ))}
                </div>

                {tab === "featured" ? (
                    <>
                        {/* Featured Events Promo Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {featuredEvents.map((event) => (
                                <div key={event.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.2)" }}>
                                    <div className="relative" style={{ height: 160 }}>
                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(10,15,13,0.85),transparent)" }} />
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                                            <Star size={10} /> FEATURED
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <p className="font-semibold text-sm mb-1 line-clamp-1" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>{event.title}</p>
                                        <p className="text-xs mb-3" style={{ color: "#78716c" }}>{event.date} · {event.city}</p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>Edit Listing</button>
                                            <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "rgba(96,165,250,0.1)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.2)" }}>
                                                <Send size={10} /> Promote
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Add New Featured Card */}
                            <button className="rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-mint" style={{ border: "2px dashed rgba(74,222,128,0.2)", minHeight: 240 }}>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.08)" }}>
                                    <Plus size={22} style={{ color: "#f97316" }} />
                                </div>
                                <p className="text-sm font-medium" style={{ color: "#f97316" }}>Feature an Event</p>
                                <p className="text-xs" style={{ color: "#78716c" }}>Boost visibility on the home page</p>
                            </button>
                        </div>
                    </>
                ) : (
                    /* Campaigns Table */
                    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.08)" }}>
                                    {["Campaign", "Type", "Event", "Sent", "Open Rate", "Revenue", "Status"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_CAMPAIGNS.map((c) => {
                                    const tc = typeColor(c.type);
                                    return (
                                        <tr key={c.id} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors" style={{ borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                                            <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a0a00" }}>{c.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: tc.bg, color: tc.color }}>
                                                    {campaignTypeIcon(c.type)} {c.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.event}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.sent > 0 ? c.sent.toLocaleString() : "—"}</td>
                                            <td className="px-4 py-3 text-xs font-medium" style={{ color: "#f97316" }}>
                                                {c.sent > 0 ? `${Math.round(c.opened / c.sent * 100)}%` : "N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>${c.revenue.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: c.status === "active" ? "rgba(74,222,128,0.1)" : c.status === "completed" ? "rgba(96,165,250,0.1)" : "rgba(90,122,101,0.1)", color: c.status === "active" ? "#f97316" : c.status === "completed" ? "#2563eb" : "#78716c" }}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                <Megaphone size={18} className="inline mr-2" style={{ color: "#f97316" }} />
                                New Campaign
                            </h2>
                            <button onClick={() => setShowCreate(false)} style={{ color: "#78716c" }}><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Campaign Name", placeholder: "e.g. Spring Music Blast" },
                                { label: "Subject Line", placeholder: "Don't miss out on..." },
                            ].map(({ label, placeholder }) => (
                                <div key={label}>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>{label}</label>
                                    <input type="text" placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Campaign Type</label>
                                <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                    <option>Email</option><option>Push Notification</option><option>Featured Listing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Target Event</label>
                                <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                    {MOCK_EVENTS.map((e) => <option key={e.id}>{e.title}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                                <Send size={14} className="inline mr-2" />Launch Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
