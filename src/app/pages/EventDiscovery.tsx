import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, MapPin, SlidersHorizontal, Star, Clock, Ticket, Sparkles, ChevronRight } from "lucide-react";
import { MOCK_EVENTS, Event } from "../mock-data";

const CATEGORIES = ["All", "Music", "Tech", "Food", "Art", "Wellness"];

function EventCard({ event }: { event: Event }) {
    return (
        <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
            <div
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                    background: "#ffffff",
                    border: "1px solid rgba(249,115,22,0.1)",
                    boxShadow: "0 4px 20px rgba(249,115,22,0.08)",
                    cursor: "pointer",
                }}
            >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ height: 200 }}>
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                    {event.featured && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#ffffff" }}>
                            <Sparkles size={11} /> Featured
                        </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff" }}>
                        {event.category}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                            <MapPin size={11} /> {event.distance?.toFixed(1)} km · {event.city}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                        {event.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "#78716c" }}>
                        <span className="flex items-center gap-1"><Clock size={11} /> {event.date}</span>
                        <span className="flex items-center gap-1"><Star size={11} style={{ color: "#f97316" }} /> {event.rating} ({event.reviewCount})</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                        {event.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md text-xs" style={{ background: "rgba(249,115,22,0.08)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs" style={{ color: "#78716c" }}>From </span>
                            <span className="text-base font-bold" style={{ color: "#f97316" }}>
                                ${Math.min(...event.tiers.map((t) => t.price))}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#f97316" }}>
                            <Ticket size={12} /> {event.tiers.reduce((s, t) => s + t.remaining, 0)} left
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function EventDiscovery() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sortBy, setSortBy] = useState("featured");

    const filtered = useMemo(() => {
        let events = [...MOCK_EVENTS];
        if (search) events = events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase()));
        if (category !== "All") events = events.filter((e) => e.category === category);
        if (sortBy === "price-asc") events.sort((a, b) => Math.min(...a.tiers.map(t => t.price)) - Math.min(...b.tiers.map(t => t.price)));
        if (sortBy === "rating") events.sort((a, b) => b.rating - a.rating);
        if (sortBy === "featured") events.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        return events;
    }, [search, category, sortBy]);

    const featured = MOCK_EVENTS.filter((e) => e.featured).slice(0, 3);

    return (
        <div style={{ paddingTop: 68 }}>
            {/* Hero Section */}
            <div
                className="relative py-16 px-6 md:px-12 text-center"
                style={{ background: "linear-gradient(135deg, #fff0e4 0%, #fce7f3 50%, #ede9fe 100%)", borderBottom: "1px solid rgba(249,115,22,0.12)" }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(249,115,22,0.12)", color: "#ea580c", border: "1px solid rgba(249,115,22,0.25)" }}>
                    <Sparkles size={12} /> Events near you
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                    Discover <span style={{ backgroundImage: "linear-gradient(135deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Unforgettable</span> Events
                </h1>
                <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: "#78716c" }}>
                    Find concerts, workshops, food festivals, and more — near you, right now.
                </p>

                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#f97316" }} />
                        <input
                            type="text"
                            placeholder="Search events, cities, venues..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={{
                                background: "#ffffff",
                                border: "1px solid rgba(249,115,22,0.25)",
                                color: "#1a0a00",
                                boxShadow: "0 2px 12px rgba(249,115,22,0.08)",
                            }}
                        />
                    </div>
                    <button
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#ffffff", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(249,115,22,0.35)" }}
                    >
                        <MapPin size={14} /> Use My Location
                    </button>
                </div>
            </div>

            <div className="px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
                {/* Featured Slider */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                            ✦ Featured Events
                        </h2>
                        <Link to="/" className="flex items-center gap-1 text-sm font-medium" style={{ color: "#f97316", textDecoration: "none" }}>
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {featured.map((event) => (
                            <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
                                <div
                                    className="relative rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                                    style={{ height: 220, border: "1px solid rgba(249,115,22,0.25)" }}
                                >
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 40%, transparent 85%)" }} />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-xs font-medium mb-1" style={{ color: "#fdba74" }}>{event.date} · {event.city}</p>
                                        <h3 className="font-bold text-sm leading-snug" style={{ color: "#ffffff", fontFamily: "'Outfit',sans-serif" }}>{event.title}</h3>
                                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>From ${Math.min(...event.tiers.map(t => t.price))}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                                style={{
                                    background: category === cat ? "#f97316" : "rgba(249,115,22,0.06)",
                                    color: category === cat ? "#fff8f4" : "#92400e",
                                    border: `1px solid ${category === cat ? "#f97316" : "rgba(249,115,22,0.18)"}`,
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="sm:ml-auto flex items-center gap-2">
                        <SlidersHorizontal size={14} style={{ color: "#78716c" }} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="py-2 px-3 rounded-xl text-sm outline-none"
                            style={{ background: "var(--color-bg-card)", color: "#92400e", border: "1px solid rgba(249,115,22,0.2)" }}
                        >
                            <option value="featured">Featured First</option>
                            <option value="rating">Top Rated</option>
                            <option value="price-asc">Price: Low to High</option>
                        </select>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm" style={{ color: "#78716c" }}>{filtered.length} events found</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </div>
    );
}
