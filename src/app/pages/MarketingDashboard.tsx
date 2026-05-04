import React, { useEffect, useMemo, useState } from "react";
import { Megaphone, Star, Send, Plus, X, Mail, Bell, Edit, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import { MOCK_EVENTS } from "../mock-data";
import { useAuth, useEvents } from "../store";
import { apiFetch } from "../lib/api";
import { useApiWithStale } from "../lib/useApiWithStale";

interface ServerCampaign {
    id: string;
    name: string;
    type: "email" | "featured" | "push";
    eventId: string;
    eventTitle: string;
    audience: string;
    content: string;
    startDate: string;
    endDate: string;
    status: "draft" | "active" | "completed" | "expired" | "closed";
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface PerfRow {
    campaignId: string;
    name: string;
    impressions: number;
    opens: number;
    clicks: number;
    bookings: number;
    revenue: number;
    salesLift: number;
    ctr: number;
    conversionRate: number;
    openRate: number;
    adMediaStale: boolean;
}

type FormState = {
    name: string;
    type: "email" | "featured" | "push";
    eventId: string;
    audience: string;
    content: string;
    startDate: string;
    endDate: string;
    status: "draft" | "active";
};

const initForm: FormState = {
    name: "",
    type: "email",
    eventId: "",
    audience: "all-users",
    content: "",
    startDate: "",
    endDate: "",
    status: "draft",
};

function statusStyle(status: ServerCampaign["status"]) {
    switch (status) {
        case "active": return { bg: "rgba(74,222,128,0.12)", color: "#16a34a", label: "Active" };
        case "draft": return { bg: "rgba(148,163,184,0.12)", color: "#64748b", label: "Draft" };
        case "completed": return { bg: "rgba(96,165,250,0.12)", color: "#2563eb", label: "Completed" };
        case "expired": return { bg: "rgba(251,191,36,0.12)", color: "#d97706", label: "Expired" };
        case "closed": return { bg: "rgba(248,113,113,0.12)", color: "#dc2626", label: "Closed" };
    }
}

export function MarketingDashboard() {
    const { currentUser } = useAuth();
    const { events: liveEvents } = useEvents();
    const events = liveEvents.length ? liveEvents : MOCK_EVENTS;
    const publishedEvents = useMemo(() => events.filter((e) => e.status === "upcoming"), [events]);
    const featuredEvents = events.filter((e) => e.featured);

    const campaignsApi = useApiWithStale<{ campaigns: ServerCampaign[] }>("campaigns:list", "/api/campaigns");
    const campaigns = campaignsApi.data?.campaigns ?? [];

    const performanceApi = useApiWithStale<{ rows: PerfRow[]; meta: { adMediaStale: boolean }; fetchedAt: string }>("campaigns:performance", "/api/analytics/campaign-performance");
    const performanceRows = performanceApi.data?.rows ?? [];
    const perfByCampaignId = useMemo(() => new Map(performanceRows.map((r) => [r.campaignId, r])), [performanceRows]);

    const [tab, setTab] = useState<"featured" | "campaigns">("campaigns");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<ServerCampaign | null>(null);
    const [form, setForm] = useState<FormState>(initForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (showCreate) {
            setForm({ ...initForm, eventId: publishedEvents[0]?.id ?? "" });
            setError(null);
        }
    }, [showCreate, publishedEvents]);

    useEffect(() => {
        if (editing) {
            setForm({
                name: editing.name,
                type: editing.type,
                eventId: editing.eventId,
                audience: editing.audience,
                content: editing.content,
                startDate: editing.startDate,
                endDate: editing.endDate,
                status: editing.status === "draft" || editing.status === "active" ? editing.status : "draft",
            });
            setError(null);
        }
    }, [editing]);

    const closeAll = () => {
        setShowCreate(false);
        setEditing(null);
        setError(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const result = await apiFetch<{ campaign: ServerCampaign }>("/api/campaigns", {
            method: "POST",
            user: currentUser,
            body: JSON.stringify(form),
        });
        setSubmitting(false);
        if (!result.ok) {
            setError(result.error || "Could not create campaign");
            return;
        }
        await campaignsApi.refetch();
        closeAll();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setSubmitting(true);
        setError(null);
        const result = await apiFetch<{ campaign: ServerCampaign }>(`/api/campaigns/${editing.id}`, {
            method: "PUT",
            user: currentUser,
            body: JSON.stringify({
                name: form.name,
                type: form.type,
                audience: form.audience,
                content: form.content,
                startDate: form.startDate,
                endDate: form.endDate,
                status: form.status,
            }),
        });
        setSubmitting(false);
        if (!result.ok) {
            setError(result.error || "Could not update campaign");
            return;
        }
        await campaignsApi.refetch();
        closeAll();
    };

    const campaignTypeIcon = (type: string) => {
        if (type === "email") return <Mail size={12} />;
        if (type === "push") return <Bell size={12} />;
        return <Star size={12} />;
    };

    const activeCampaigns = campaigns.filter((c) => c.status === "active");
    const totalSent = performanceRows.reduce((s, r) => s + r.impressions, 0);
    const totalRevenue = performanceRows.reduce((s, r) => s + r.revenue, 0);
    const avgOpenRate = performanceRows.length > 0
        ? performanceRows.reduce((s, r) => s + r.openRate, 0) / performanceRows.length
        : 0;

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Marketing Hub</h1>
                        <p className="text-sm" style={{ color: "#78716c" }}>Manage featured listings, campaigns, and promotions</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                        <Plus size={15} /> New Campaign
                    </button>
                </div>

                {(campaignsApi.isStale || performanceApi.isStale) && (campaignsApi.lastLoadedAt || performanceApi.lastLoadedAt) && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#92400e" }}>
                        <AlertTriangle size={12} /> Showing last-loaded data — backend unreachable.
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Active Campaigns", value: activeCampaigns.length, color: "#f97316" },
                        { label: "Impressions", value: totalSent.toLocaleString(), color: "#2563eb" },
                        { label: "Avg Open Rate", value: `${(avgOpenRate * 100).toFixed(1)}%`, color: "#7c3aed" },
                        { label: "Campaign Revenue", value: `$${Math.round(totalRevenue).toLocaleString()}`, color: "#d97706" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <p className="text-2xl font-bold mb-1" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                            <p className="text-xs" style={{ color: "#78716c" }}>{label}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mb-6">
                    {(["campaigns", "featured"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all" style={{ background: tab === t ? "#f97316" : "rgba(249,115,22,0.06)", color: tab === t ? "#fff8f4" : "#92400e", border: `1px solid ${tab === t ? "#f97316" : "rgba(249,115,22,0.18)"}` }}>
                            {t === "featured" ? "⭐ Featured Events" : "📊 Campaigns"}
                        </button>
                    ))}
                </div>

                {tab === "featured" ? (
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
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.08)" }}>
                                    {["Campaign", "Type", "Event", "Impr.", "CTR", "Conv.", "Sales Lift", "Status", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => {
                                    const sty = statusStyle(c.status);
                                    const perf = perfByCampaignId.get(c.id);
                                    const editable = c.status !== "closed" && c.status !== "expired";
                                    return (
                                        <tr key={c.id} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors" style={{ borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                                            <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a0a00" }}>{c.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: "rgba(96,165,250,0.1)", color: "#2563eb" }}>
                                                    {campaignTypeIcon(c.type)} {c.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.eventTitle}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{(perf?.impressions ?? c.sent).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs font-medium" style={{ color: "#f97316" }}>{perf ? `${(perf.ctr * 100).toFixed(1)}%` : "—"}</td>
                                            <td className="px-4 py-3 text-xs font-medium" style={{ color: "#16a34a" }}>{perf ? `${(perf.conversionRate * 100).toFixed(1)}%` : "—"}</td>
                                            <td className="px-4 py-3 text-xs font-bold" style={{ color: perf && perf.salesLift >= 0 ? "#16a34a" : "#dc2626" }}>{perf ? `${perf.salesLift >= 0 ? "+" : ""}$${Math.round(perf.salesLift).toLocaleString()}` : "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: sty.bg, color: sty.color }}>{sty.label}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button disabled={!editable} onClick={() => editable && setEditing(c)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: editable ? "rgba(96,165,250,0.08)" : "rgba(0,0,0,0.05)", color: editable ? "#2563eb" : "#94a3b8", cursor: editable ? "pointer" : "not-allowed" }} title={editable ? "Edit" : `Cannot edit ${c.status}`}>
                                                        <Edit size={11} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {campaigns.length === 0 && (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-xs" style={{ color: "#78716c" }}>{campaignsApi.isLoading ? "Loading…" : "No campaigns yet. Create one to get started."}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {(showCreate || editing) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeAll(); }}>
                    <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                <Megaphone size={18} style={{ color: "#f97316" }} />
                                {editing ? "Edit Campaign" : "New Campaign"}
                            </h2>
                            <button onClick={closeAll}><X size={18} style={{ color: "#78716c" }} /></button>
                        </div>
                        {editing && (
                            <div className="mb-4 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: statusStyle(editing.status).bg, color: statusStyle(editing.status).color }}>
                                Status: {statusStyle(editing.status).label}
                            </div>
                        )}
                        <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Campaign Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spring Music Blast" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Campaign Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState["type"] })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                    <option value="email">Email</option>
                                    <option value="push">Push Notification</option>
                                    <option value="featured">Featured Listing</option>
                                </select>
                            </div>
                            {!editing && (
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Linked Event * (Published only)</label>
                                    <select required value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                        <option value="">Select an event…</option>
                                        {publishedEvents.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Start Date *</label>
                                    <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>End Date *</label>
                                    <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Target Audience</label>
                                <input type="text" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="all-users, returning, new-signups…" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Content / Subject</label>
                                <textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Don't miss out on…" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                                    <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                                    <p className="text-xs" style={{ color: "#991b1b" }}>{error}</p>
                                </div>
                            )}
                            <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> {editing ? "Save Changes" : "Launch Campaign"}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
