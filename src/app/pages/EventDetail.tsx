import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MapPin, Calendar, Star, Share2, Heart, ShoppingCart, Clock, ChevronLeft, Plus, Minus, ExternalLink, Ticket } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MOCK_EVENTS } from "../mock-data";
import { useCart } from "../store";

// Fix leaflet default marker icons for Vite builds
const defaultIcon = new L.Icon({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Music: { bg: "#fef3c7", text: "#d97706" },
    Tech: { bg: "#ede9fe", text: "#7c3aed" },
    Food: { bg: "#dcfce7", text: "#16a34a" },
    Art: { bg: "#fce7f3", text: "#db2777" },
    Wellness: { bg: "#e0f2fe", text: "#0369a1" },
    Sports: { bg: "#fee2e2", text: "#dc2626" },
};

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const event = MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0];
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [added, setAdded] = useState(false);
    const [liked, setLiked] = useState(false);

    // Use lat/lng from event data
    const coords: [number, number] = [event.lat, event.lng];
    const catColor = CATEGORY_COLORS[event.category] || { bg: "#fef3c7", text: "#d97706" };

    const totalQty = Object.values(quantities).reduce((a: number, b: number) => a + b, 0);
    const totalPrice = event.tiers.reduce(
        (s: number, t) => s + (quantities[t.name] || 0) * t.price, 0
    );

    const setQ = (tier: string, delta: number) => {
        setQuantities((prev: Record<string, number>) => {
            const next = Math.max(0, (prev[tier] || 0) + delta);
            return { ...prev, [tier]: next };
        });
    };

    const handleAddToCart = () => {
        event.tiers.forEach((t) => {
            if (quantities[t.name] > 0) {
                addItem({ eventId: event.id, eventTitle: event.title, tier: t.name, price: t.price, quantity: quantities[t.name], image: event.image });
            }
        });
        setAdded(true);
        setTimeout(() => navigate("/checkout"), 750);
    };

    return (
        <div style={{ paddingTop: 64, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            {/* Hero */}
            <div className="relative" style={{ height: 420 }}>
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,10,0,0.85) 0%, rgba(26,10,0,0.3) 60%, transparent 100%)" }} />

                {/* Back button */}
                <button onClick={() => navigate(-1)} className="absolute top-5 left-6 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <ChevronLeft size={14} /> Back
                </button>

                {/* Status badge */}
                <div className="absolute top-5 right-6">
                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize" style={{ background: event.status === "upcoming" ? "rgba(249,115,22,0.9)" : "rgba(139,92,246,0.9)", color: "#fff" }}>
                        {event.status}
                    </span>
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: catColor.bg, color: catColor.text }}>{event.category}</span>
                        {event.featured && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>⭐ Featured</span>}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "#ffffff" }}>
                        {event.title}
                    </h1>
                    <div className="flex flex-wrap gap-5 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {event.date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {event.time}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.venue}, {event.city}</span>
                        <span className="flex items-center gap-1.5"><Star size={13} style={{ color: "#f97316" }} /> {event.rating} ({event.reviewCount} reviews)</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: details + map */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="p-6 rounded-2xl" style={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.1)", boxShadow: "0 2px 16px rgba(249,115,22,0.06)" }}>
                        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>About this event</h2>
                        <p className="text-sm leading-relaxed" style={{ color: "#78716c" }}>{event.description}</p>
                        <div className="grid grid-cols-2 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid rgba(249,115,22,0.1)" }}>
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: "#78716c" }}>Organizer</p>
                                <p className="text-sm font-semibold" style={{ color: "#1a0a00" }}>{event.organizer}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: "#78716c" }}>Venue</p>
                                <p className="text-sm font-semibold" style={{ color: "#1a0a00" }}>{event.venue}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: "#78716c" }}>Address</p>
                                <p className="text-sm font-semibold" style={{ color: "#1a0a00" }}>{event.address}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: "#78716c" }}>City</p>
                                <p className="text-sm font-semibold" style={{ color: "#1a0a00" }}>{event.city}</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Map */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(249,115,22,0.15)", boxShadow: "0 2px 16px rgba(249,115,22,0.06)" }}>
                        <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#ffffff", borderBottom: "1px solid rgba(249,115,22,0.1)" }}>
                            <div>
                                <p className="text-sm font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                    <MapPin size={14} className="inline mr-1.5" style={{ color: "#f97316" }} />
                                    Venue Location
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "#78716c" }}>{event.venue} · {event.city}</p>
                            </div>
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}&zoom=15`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                                style={{ background: "rgba(249,115,22,0.08)", color: "#f97316" }}
                            >
                                <ExternalLink size={11} /> Open maps
                            </a>
                        </div>
                        <div style={{ height: 320 }}>
                            <MapContainer center={coords} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={coords} icon={defaultIcon}>
                                    <Popup>
                                        <strong>{event.venue}</strong><br />
                                        {event.address}<br />
                                        {event.city}<br />
                                        <a href={`https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}`} target="_blank" rel="noopener noreferrer">View on map ↗</a>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "#fff0e8", color: "#92400e", border: "1px solid rgba(249,115,22,0.15)" }}>#{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Right: Ticket selector */}
                <div className="space-y-4">
                    <div className="sticky top-24 p-5 rounded-2xl" style={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.15)", boxShadow: "0 4px 24px rgba(249,115,22,0.1)" }}>
                        <h2 className="text-base font-bold mb-4" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Select Tickets</h2>
                        <div className="space-y-3 mb-5">
                            {event.tiers.map((tier) => (
                                <div key={tier.name} className="p-4 rounded-xl" style={{ background: quantities[tier.name] ? "rgba(249,115,22,0.05)" : "#fff8f4", border: `1px solid ${quantities[tier.name] ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.1)"}`, transition: "all 0.2s" }}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "#1a0a00" }}>{tier.name}</p>
                                            <p className="text-xs" style={{ color: "#78716c" }}>{tier.remaining} of {tier.total} left</p>
                                        </div>
                                        <p className="text-base font-black" style={{ color: "#f97316" }}>${tier.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setQ(tier.name, -1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all" style={{ background: quantities[tier.name] ? "#ef4444" : "rgba(249,115,22,0.1)", color: quantities[tier.name] ? "#fff" : "#78716c" }}>
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold" style={{ color: "#1a0a00" }}>{quantities[tier.name] || 0}</span>
                                        <button onClick={() => setQ(tier.name, 1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalQty > 0 && (
                            <div className="mb-4 px-4 py-3 rounded-xl" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: "#78716c" }}>{totalQty} ticket{totalQty > 1 ? "s" : ""}</span>
                                    <span className="font-black text-base" style={{ color: "#f97316" }}>${totalPrice}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAddToCart}
                            disabled={totalQty === 0}
                            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            style={{ background: totalQty > 0 ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(249,115,22,0.15)", color: totalQty > 0 ? "#fff" : "#78716c", cursor: totalQty === 0 ? "not-allowed" : "pointer", boxShadow: totalQty > 0 ? "0 4px 16px rgba(249,115,22,0.35)" : "none" }}
                        >
                            {added ? "✓ Added! Redirecting..." : <><ShoppingCart size={15} /> Add to Cart</>}
                        </button>

                        <div className="flex gap-2 mt-3">
                            <button onClick={() => setLiked(!liked)} className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all" style={{ background: liked ? "rgba(220,38,38,0.08)" : "rgba(249,115,22,0.05)", color: liked ? "#dc2626" : "#78716c", border: `1px solid ${liked ? "rgba(220,38,38,0.2)" : "rgba(249,115,22,0.1)"}` }}>
                                <Heart size={13} fill={liked ? "#dc2626" : "none"} /> {liked ? "Saved" : "Save"}
                            </button>
                            <button className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: "rgba(139,92,246,0.08)", color: "#7c3aed", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <Share2 size={13} /> Share
                            </button>
                        </div>

                        <div className="mt-4 pt-3 flex items-center gap-1.5 text-xs" style={{ color: "#78716c", borderTop: "1px solid rgba(249,115,22,0.08)" }}>
                            <Ticket size={11} style={{ color: "#f97316" }} />
                            Tickets are non-refundable. Check event policy.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
