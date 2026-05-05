// Self-contained seed data for Vercel functions. Mirrors src/app/mock-data.ts
// (subset of fields actually used by the API). Kept here so the function bundle
// doesn't need to cross the api/ → src/ boundary.

export interface SeedTier { id: string; name: string; price: number; total: number; remaining: number; }
export interface SeedEvent {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    venue: string;
    city: string;
    organizer: string;
    organizerId: string;
    status: "upcoming" | "ongoing" | "completed" | "cancelled" | "draft";
    rating: number;
    reviewCount: number;
    featured: boolean;
    tiers: SeedTier[];
}

export interface SeedBooking {
    id: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    userId: string;
    tierName: string;
    quantity: number;
    total: number;
    status: "confirmed" | "cancelled" | "pending";
    bookedAt: string;
    qrCode: string;
}

export interface SeedCampaign {
    id: string;
    name: string;
    type: "email" | "featured" | "push";
    event: string;
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
    status: "active" | "draft" | "completed";
    date: string;
}

export interface SeedRevenueRecord {
    id: string;
    eventTitle: string;
    organizer: string;
    gross: number;
    commission: number;
    payout: number;
    status: "paid" | "processing" | "pending";
    date: string;
}

export interface SeedAnalyticsMetric {
    month: string;
    ticketsSold: number;
    revenue: number;
    attendees: number;
    newUsers: number;
}

export const MOCK_EVENTS: SeedEvent[] = [
    { id: "e1", title: "Neon Nights Electronic Festival", description: "Electronic music festival.", category: "Music", date: "2026-03-15", time: "8:00 PM", venue: "Skyline Arena", city: "Miami, FL", organizer: "Pulse Events Co.", organizerId: "u2", status: "upcoming", rating: 4.8, reviewCount: 312, featured: true, tiers: [
        { id: "t1a", name: "General", price: 49, remaining: 200, total: 500 },
        { id: "t1b", name: "VIP", price: 149, remaining: 42, total: 100 },
    ] },
    { id: "e2", title: "Startup Founders Summit 2026", description: "Founders summit.", category: "Tech", date: "2026-03-22", time: "9:00 AM", venue: "Innovation Hub", city: "San Francisco, CA", organizer: "TechCircle Inc.", organizerId: "u2", status: "upcoming", rating: 4.9, reviewCount: 189, featured: true, tiers: [
        { id: "t2a", name: "Standard", price: 299, remaining: 150, total: 300 },
        { id: "t2b", name: "Founder Pass", price: 599, remaining: 28, total: 50 },
    ] },
    { id: "e3", title: "Culinary World Tour", description: "Street food festival.", category: "Food", date: "2026-04-05", time: "11:00 AM", venue: "Central Park Meadow", city: "New York, NY", organizer: "Flavor Collective", organizerId: "u2", status: "upcoming", rating: 4.7, reviewCount: 427, featured: false, tiers: [
        { id: "t3a", name: "Day Pass", price: 35, remaining: 400, total: 800 },
        { id: "t3b", name: "Chef's Table", price: 120, remaining: 15, total: 30 },
    ] },
    { id: "e4", title: "Impressionist Art Exhibition", description: "Curated art.", category: "Art", date: "2026-03-28", time: "10:00 AM", venue: "Metropolitan Gallery", city: "Chicago, IL", organizer: "Gallery Collective", organizerId: "u2", status: "upcoming", rating: 4.6, reviewCount: 156, featured: false, tiers: [
        { id: "t4a", name: "Standard", price: 25, remaining: 600, total: 1000 },
        { id: "t4b", name: "Curator Tour", price: 75, remaining: 18, total: 50 },
    ] },
    { id: "e5", title: "Mountain Wellness Retreat", description: "Wellness retreat.", category: "Wellness", date: "2026-04-12", time: "8:00 AM", venue: "Aspen Lodge", city: "Aspen, CO", organizer: "Mindful Living Co.", organizerId: "u2", status: "upcoming", rating: 4.9, reviewCount: 98, featured: true, tiers: [
        { id: "t5a", name: "Weekend Pass", price: 449, remaining: 32, total: 80 },
    ] },
    { id: "e6", title: "Indie Rock Showcase", description: "Indie rock night.", category: "Music", date: "2026-03-20", time: "7:30 PM", venue: "The Underground", city: "Austin, TX", organizer: "Soundwave Productions", organizerId: "u2", status: "upcoming", rating: 4.5, reviewCount: 73, featured: false, tiers: [
        { id: "t6a", name: "GA", price: 30, remaining: 250, total: 400 },
    ] },
    { id: "e7", title: "AI & ML Conference 2026", description: "Tech conference.", category: "Tech", date: "2026-04-18", time: "9:00 AM", venue: "Tech Plaza", city: "Seattle, WA", organizer: "DataMinds Forum", organizerId: "u2", status: "upcoming", rating: 4.8, reviewCount: 245, featured: true, tiers: [
        { id: "t7a", name: "Day Pass", price: 199, remaining: 180, total: 400 },
        { id: "t7b", name: "Workshop Bundle", price: 449, remaining: 35, total: 80 },
    ] },
    { id: "e8", title: "Yoga in the Park", description: "Outdoor yoga.", category: "Wellness", date: "2026-03-30", time: "7:00 AM", venue: "Riverside Park", city: "Portland, OR", organizer: "Flow Studios", organizerId: "u2", status: "upcoming", rating: 4.7, reviewCount: 142, featured: false, tiers: [
        { id: "t8a", name: "Drop-in", price: 15, remaining: 180, total: 250 },
    ] },
];

export const MOCK_BOOKINGS: SeedBooking[] = [
    { id: "b1", eventId: "e1", eventTitle: "Neon Nights Electronic Festival", eventDate: "Mar 15, 2026", eventVenue: "Skyline Arena, Miami FL", userId: "u1", tierName: "VIP", quantity: 2, total: 298, status: "confirmed", bookedAt: "2026-02-10", qrCode: "QR-PLANZO-B1-U1" },
    { id: "b2", eventId: "e2", eventTitle: "Startup Founders Summit 2026", eventDate: "Mar 22, 2026", eventVenue: "Innovation Hub, SF CA", userId: "u1", tierName: "Founder Pass", quantity: 1, total: 599, status: "confirmed", bookedAt: "2026-02-14", qrCode: "QR-PLANZO-B2-U1" },
    { id: "b3", eventId: "e3", eventTitle: "Culinary World Tour", eventDate: "Apr 5, 2026", eventVenue: "Central Park, NYC", userId: "u1", tierName: "Day Pass", quantity: 3, total: 105, status: "pending", bookedAt: "2026-02-20", qrCode: "QR-PLANZO-B3-U1" },
];

export const MOCK_CAMPAIGNS: SeedCampaign[] = [
    { id: "c1", name: "Spring Music Blast", type: "email", event: "Neon Nights Electronic Festival", sent: 8420, opened: 3215, clicked: 412, revenue: 18450, status: "active", date: "2026-02-15" },
    { id: "c2", name: "Tech Founders Outreach", type: "email", event: "Startup Founders Summit 2026", sent: 5100, opened: 2890, clicked: 678, revenue: 28950, status: "active", date: "2026-02-18" },
    { id: "c3", name: "Foodie Featured Listing", type: "featured", event: "Culinary World Tour", sent: 0, opened: 0, clicked: 1240, revenue: 12300, status: "completed", date: "2026-02-10" },
    { id: "c4", name: "Wellness Retreat Push", type: "push", event: "Mountain Wellness Retreat", sent: 3200, opened: 1856, clicked: 245, revenue: 8950, status: "draft", date: "2026-02-25" },
];

export const MOCK_REVENUE: SeedRevenueRecord[] = [
    { id: "r1", eventTitle: "Neon Nights Electronic Festival", organizer: "Pulse Events Co.", gross: 48750, commission: 4875, payout: 43875, status: "paid", date: "2026-02-15" },
    { id: "r2", eventTitle: "Startup Founders Summit 2026", organizer: "TechCircle Inc.", gross: 62300, commission: 6230, payout: 56070, status: "processing", date: "2026-02-18" },
    { id: "r3", eventTitle: "Culinary World Tour", organizer: "Flavor Collective", gross: 28500, commission: 2850, payout: 25650, status: "pending", date: "2026-02-20" },
];

export const MOCK_ANALYTICS: SeedAnalyticsMetric[] = [
    { month: "Sep", ticketsSold: 2100, revenue: 98000, attendees: 1850, newUsers: 412 },
    { month: "Oct", ticketsSold: 2780, revenue: 134000, attendees: 2410, newUsers: 524 },
    { month: "Nov", ticketsSold: 3120, revenue: 156000, attendees: 2680, newUsers: 678 },
    { month: "Dec", ticketsSold: 4200, revenue: 212000, attendees: 3650, newUsers: 892 },
    { month: "Jan", ticketsSold: 3450, revenue: 178000, attendees: 2980, newUsers: 745 },
    { month: "Feb", ticketsSold: 4800, revenue: 240000, attendees: 4150, newUsers: 1024 },
];
