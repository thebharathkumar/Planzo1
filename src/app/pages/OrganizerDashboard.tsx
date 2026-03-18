import React, { useState } from "react";
import {
    Plus, Users, DollarSign, BarChart2, Edit, Trash2, Eye, Calendar,
    X, Check, Send, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, BellRing
} from "lucide-react";
import { MOCK_BOOKINGS } from "../mock-data";
import { useEvents, useAuth } from "../store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const revenueData = [
    { month: "Jan", revenue: 12400 }, { month: "Feb", revenue: 18700 },
    { month: "Mar", revenue: 24300 }, { month: "Apr", revenue: 19800 },
    { month: "May", revenue: 31200 }, { month: "Jun", revenue: 28600 },
];

type CreateForm = {
    title: string; date: string; category: string; venue: string;
    description: string; image: string;
    tiers: { name: string; price: string; capacity: string }[];
};

const initForm: CreateForm = {
    title: "", date: "", category: "Music", venue: "", description: "", image: "",
    tiers: [{ name: "General", price: "", capacity: "" }],
};

type EditForm = { title: string; date: string; venue: string };

export function OrganizerDashboard() {
    const { currentUser } = useAuth();
    const { events: allEvents, addEvent, updateEvent, deleteEvent } = useEvents();
    const events = allEvents.filter(e => e.organizerId === currentUser?.id);
    const [localBookings, setLocalBookings] = useState(MOCK_BOOKINGS.filter(b => events.some(e => e.id === b.eventId)));
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showSendUpdate, setShowSendUpdate] = useState(false);
    const [showRegistrations, setShowRegistrations] = useState(false);
    const [form, setForm] = useState<CreateForm>(initForm);
    const [editForm, setEditForm] = useState<EditForm>({ title: "", date: "", venue: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [updateMsg, setUpdateMsg] = useState("");
    const [updateSent, setUpdateSent] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    const stats = [
        { label: "Active Events", value: events.filter(e => e.status !== "draft").length, icon: Calendar, color: "#f97316" },
        { label: "Total Attendees", value: "4,280", icon: Users, color: "#2563eb" },
        { label: "Revenue (MTD)", value: "$62,300", icon: DollarSign, color: "#d97706" },
        { label: "Avg. Rating", value: "4.8 ★", icon: BarChart2, color: "#7c3aed" },
    ];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            const newId = `event-${Date.now()}`;
            const newEvent = {
                id: newId,
                title: form.title,
                date: form.date,
                time: "TBD",
                venue: form.venue,
                address: form.venue,
                city: "TBD",
                category: form.category,
                description: form.description,
                featured: false,
                image: form.image || "",
                lat: 0,
                lng: 0,
                organizer: currentUser?.name || "You",
                organizerId: currentUser?.id || "u1",
                tags: [form.category],
                rating: 0,
                reviewCount: 0,
                status: "upcoming" as const,
                tiers: form.tiers.map((t, i) => ({
                    id: `tier-${i}`,
                    name: t.name || "General",
                    description: "",
                    price: parseFloat(t.price) || 1,
                    total: parseInt(t.capacity) || 1,
                    remaining: parseInt(t.capacity) || 1,
                })),
            };
            addEvent(newEvent);
            setSaving(false);
            setShowCreate(false);
            setForm(initForm);
        }, 800);
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            const updated = events.find(ev => ev.id === editingId);
            if (updated) updateEvent({ ...updated, title: editForm.title, date: editForm.date, venue: editForm.venue });
            setSaving(false); setShowEdit(false); setEditingId(null);
        }, 800);
    };

    const openEdit = (ev: typeof events[0]) => {
        setEditingId(ev.id);
        setEditForm({ title: ev.title, date: ev.date, venue: ev.venue });
        setShowEdit(true);
    };

    const togglePublish = (event: typeof events[0]) => {
        updateEvent({ ...event, status: event.status === "draft" ? "upcoming" : "draft" });
    };

    const handleSendUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateLoading(true);
        setTimeout(() => { setUpdateSent(true); setUpdateLoading(false); setTimeout(() => { setShowSendUpdate(false); setUpdateSent(false); setUpdateMsg(""); }, 1500); }, 1200);
    };

    const addTier = () => setForm(f => ({ ...f, tiers: [...f.tiers, { name: "", price: "", capacity: "" }] }));
    const removeTier = (i: number) => setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Organizer Dashboard</h1>
                        <p className="text-sm" style={{ color: "#78716c" }}>Create, manage, and track your events</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowRegistrations(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                            <Users size={14} /> Registrations
                        </button>
                        <button onClick={() => setShowSendUpdate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: "rgba(96,165,250,0.1)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.25)" }}>
                            <BellRing size={14} /> Send Update
                        </button>
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                            <Plus size={15} /> Create Event
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{label}</p>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Events Table */}
                    <div className="lg:col-span-2">
                        <h2 className="text-base font-bold mb-4" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>My Events</h2>
                        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.08)" }}>
                                        {["Event", "Date", "Tickets", "Revenue", "Status", "Actions"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(249,115,22,0.04)]">
                                    {events.map((event) => {
                                        const isPublished = event.status !== "draft";
                                        return (
                                            <tr key={event.id} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-sm leading-snug line-clamp-1" style={{ color: "#1a0a00" }}>{event.title}</p>
                                                    <p className="text-xs" style={{ color: "#78716c" }}>{event.category}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{event.date}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-medium" style={{ color: "#f97316" }}>
                                                        {event.tiers.reduce((s, t) => s + t.total - t.remaining, 0)}/{event.tiers.reduce((s, t) => s + t.total, 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>
                                                    ${event.tiers.reduce((s, t) => s + (t.total - t.remaining) * t.price, 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => togglePublish(event)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                                                        style={{
                                                            background: isPublished ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.08)",
                                                            color: isPublished ? "#f97316" : "#dc2626",
                                                            border: `1px solid ${isPublished ? "rgba(249,115,22,0.25)" : "rgba(248,113,113,0.2)"}`,
                                                        }}>
                                                        {isPublished ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                                                        {isPublished ? "Live" : "Draft"}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(249,115,22,0.08)", color: "#f97316" }} title="View"><Eye size={12} /></button>
                                                        <button onClick={() => openEdit(event)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.08)", color: "#2563eb" }} title="Edit"><Edit size={12} /></button>
                                                        <button onClick={() => { if(window.confirm('Are you sure you want to delete this event?')) deleteEvent(event.id); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(248,113,113,0.08)", color: "#dc2626" }} title="Delete"><Trash2 size={12} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue Chart + Recent Bookings */}
                    <div>
                        <h2 className="text-base font-bold mb-4" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Revenue Trend</h2>
                        <div className="p-4 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <h2 className="text-base font-bold mt-6 mb-3" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Recent Bookings</h2>
                        <div className="space-y-2">
                            {localBookings.slice(0, 5).map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.06)" }}>
                                    <div>
                                        <p className="text-xs font-medium" style={{ color: "#1a0a00" }}>{b.eventTitle.slice(0, 22)}…</p>
                                        <p className="text-xs" style={{ color: "#78716c" }}>{b.tierName} × {b.quantity}</p>
                                    </div>
                                    <p className="text-xs font-bold" style={{ color: "#f97316" }}>${b.total}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
                    <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Create New Event</h2>
                            <button onClick={() => setShowCreate(false)} style={{ color: "#78716c" }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {[
                                { id: "title", label: "Event Title", placeholder: "e.g. Summer Music Festival", type: "text" },
                                { id: "date", label: "Date", placeholder: "", type: "date" },
                                { id: "venue", label: "Venue", placeholder: "e.g. Central Park, NYC", type: "text" },
                                { id: "image", label: "Image URL", placeholder: "https://...", type: "url" },
                            ].map(({ id, label, placeholder, type }) => (
                                <div key={id}>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>{label}</label>
                                    <input type={type} placeholder={placeholder} min={type === "date" ? new Date().toISOString().split('T')[0] : undefined} value={form[id as keyof CreateForm] as string} onChange={(e) => setForm({ ...form, [id]: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Category</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                    {["Music", "Tech", "Food", "Art", "Wellness"].map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Multi-Tier Ticket Configuration */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium" style={{ color: "#92400e" }}>Ticket Tiers</label>
                                    <button type="button" onClick={addTier} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>+ Add Tier</button>
                                </div>
                                <div className="space-y-2">
                                    {form.tiers.map((tier, i) => (
                                        <div key={i} className="p-3 rounded-xl" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.12)" }}>
                                            <div className="grid grid-cols-3 gap-2">
                                                <input required placeholder="Tier name" value={tier.name} onChange={(e) => { const t = [...form.tiers]; t[i].name = e.target.value; setForm({ ...form, tiers: t }); }} className="px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.15)", color: "#1a0a00" }} />
                                                <input required min="1" placeholder="Price $" type="number" value={tier.price} onChange={(e) => { const t = [...form.tiers]; t[i].price = e.target.value; setForm({ ...form, tiers: t }); }} className="px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.15)", color: "#1a0a00" }} />
                                                <div className="flex gap-1">
                                                    <input required min="1" placeholder="Capacity" type="number" value={tier.capacity} onChange={(e) => { const t = [...form.tiers]; t[i].capacity = e.target.value; setForm({ ...form, tiers: t }); }} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.15)", color: "#1a0a00" }} />
                                                    {form.tiers.length > 1 && <button type="button" onClick={() => removeTier(i)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#dc2626" }}><X size={10} /></button>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Description</label>
                                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                            </div>
                            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                                {saving ? <div className="w-4 h-4 border-2 border-[#fff8f4] border-t-transparent rounded-full animate-spin" /> : "Publish Event"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEdit && editingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(96,165,250,0.25)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Edit Event</h2>
                            <button onClick={() => setShowEdit(false)} style={{ color: "#78716c" }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEdit} className="space-y-4">
                            {[
                                { id: "title", label: "Event Title", type: "text" },
                                { id: "date", label: "Date", type: "date" },
                                { id: "venue", label: "Venue", type: "text" },
                            ].map(({ id, label, type }) => (
                                <div key={id}>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>{label}</label>
                                    <input required type={type} min={type === "date" ? new Date().toISOString().split('T')[0] : undefined} value={editForm[id as keyof EditForm]} onChange={(e) => setEditForm({ ...editForm, [id]: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                            ))}
                            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} /> Save Changes</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Send Update to Attendees Modal */}
            {showSendUpdate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(96,165,250,0.25)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <BellRing size={18} style={{ color: "#2563eb" }} />
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Send Update to Attendees</h2>
                            </div>
                            <button onClick={() => setShowSendUpdate(false)}><X size={18} style={{ color: "#78716c" }} /></button>
                        </div>
                        {updateSent ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(249,115,22,0.1)", border: "2px solid #f97316" }}>
                                    <Check size={28} style={{ color: "#f97316" }} />
                                </div>
                                <p className="font-bold mb-1" style={{ color: "#1a0a00" }}>Update Sent!</p>
                                <p className="text-sm" style={{ color: "#78716c" }}>All attendees have been notified.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSendUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Select Event</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                        {events.map(ev => <option key={ev.id}>{ev.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Message</label>
                                    <textarea rows={4} required value={updateMsg} onChange={(e) => setUpdateMsg(e.target.value)} placeholder="e.g. Change of venue: The event will now be held at..." className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                                <button type="submit" disabled={updateLoading} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                                    {updateLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> Send to All Attendees</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Registrations Modal */}
            {showRegistrations && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
                    <div className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Users size={18} style={{ color: "#f97316" }} />
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Attendee Registrations</h2>
                            </div>
                            <button onClick={() => setShowRegistrations(false)}><X size={18} style={{ color: "#78716c" }} /></button>
                        </div>
                        <div className="space-y-2">
                            {localBookings.map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "#1a0a00" }}>User #{b.userId}</p>
                                        <p className="text-xs" style={{ color: "#78716c" }}>{b.eventTitle.slice(0, 28)}… · {b.tierName} × {b.quantity}</p>
                                        <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: b.status === "confirmed" ? "rgba(74,222,128,0.1)" : b.status === "cancelled" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)", color: b.status === "confirmed" ? "#f97316" : b.status === "cancelled" ? "#dc2626" : "#d97706" }}>{b.status}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setLocalBookings(lbs => lbs.map(lb => lb.id === b.id ? { ...lb, status: "confirmed" } : lb))} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>✓ Approve</button>
                                        <button onClick={() => setLocalBookings(lbs => lbs.map(lb => lb.id === b.id ? { ...lb, status: "cancelled" } : lb))} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: "rgba(248,113,113,0.08)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.2)" }}>✕ Cancel</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
