// ─── Planzo Mock Data ────────────────────────────────────────────────────

export type Role = "attendee" | "organizer" | "admin" | "finance" | "marketing";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  verified: boolean;
  password?: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  remaining: number;
  total: number;
  description: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distance?: number;
  organizer: string;
  organizerId: string;
  image: string;
  tags: string[];
  tiers: TicketTier[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "draft";
}

export interface Booking {
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

export interface RevenueRecord {
  id: string;
  eventTitle: string;
  organizer: string;
  gross: number;
  commission: number;
  payout: number;
  status: "paid" | "pending" | "processing";
  date: string;
}

export interface AnalyticsMetric {
  month: string;
  ticketsSold: number;
  revenue: number;
  attendees: number;
  newUsers: number;
}

export interface Campaign {
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

// ─── Users ───────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  { id: "u1", name: "Alex Rivera", email: "alex@planzo.io", role: "attendee", avatar: "AR", verified: true, password: "password123" },
  { id: "u2", name: "Sam Chen", email: "sam@planzo.io", role: "organizer", avatar: "SC", verified: true, password: "password123" },
  { id: "u3", name: "Jordan Blake", email: "jordan@planzo.io", role: "admin", avatar: "JB", verified: true, password: "password123" },
  { id: "u4", name: "Taylor Kim", email: "taylor@planzo.io", role: "finance", avatar: "TK", verified: true, password: "password123" },
  { id: "u5", name: "Morgan Lee", email: "morgan@planzo.io", role: "marketing", avatar: "ML", verified: true, password: "password123" },
];

// ─── Events ──────────────────────────────────────────────────────────────

export const MOCK_EVENTS: Event[] = [
  {
    id: "e1",
    title: "Neon Nights Electronic Festival",
    description: "A breathtaking electronic music experience featuring world-class DJs across 3 stages. Immersive light installations, art galleries, and gourmet food village.",
    category: "Music",
    date: "2026-03-15",
    time: "8:00 PM",
    venue: "Skyline Arena",
    address: "123 Harbor Blvd",
    city: "Miami, FL",
    lat: 25.7617,
    lng: -80.1918,
    distance: 1.2,
    organizer: "Pulse Events Co.",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop",
    tags: ["EDM", "Nightlife", "Festival"],
    tiers: [
      { id: "t1a", name: "General", price: 49, remaining: 200, total: 500, description: "General admission access to all stages" },
      { id: "t1b", name: "VIP", price: 149, remaining: 42, total: 100, description: "VIP lounge, premium bar access, artist meet & greet" },
    ],
    rating: 4.8,
    reviewCount: 312,
    featured: true,
    status: "upcoming",
  },
  {
    id: "e2",
    title: "Startup Founders Summit 2026",
    description: "Connect with 500+ founders, VCs, and innovators. Keynotes from unicorn founders, pitch competitions, and hands-on workshops.",
    category: "Tech",
    date: "2026-03-22",
    time: "9:00 AM",
    venue: "Innovation Hub",
    address: "456 Tech Park Dr",
    city: "San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    distance: 0.8,
    organizer: "TechCircle Inc.",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    tags: ["Tech", "Startups", "Networking"],
    tiers: [
      { id: "t2a", name: "Standard", price: 299, remaining: 150, total: 300, description: "Full conference access" },
      { id: "t2b", name: "Founder Pass", price: 599, remaining: 28, total: 50, description: "Includes dinner, investor speed-dating, afterparty" },
    ],
    rating: 4.9,
    reviewCount: 189,
    featured: true,
    status: "upcoming",
  },
  {
    id: "e3",
    title: "Culinary World Tour: Street Food Edition",
    description: "Explore 40+ cuisines from around the world in one vibrant outdoor festival. Live cooking demos, celebrity chefs, and artisan markets.",
    category: "Food",
    date: "2026-04-05",
    time: "11:00 AM",
    venue: "Central Park Meadow",
    address: "Central Park West",
    city: "New York, NY",
    lat: 40.7828,
    lng: -73.9654,
    distance: 2.4,
    organizer: "Flavor Collective",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop",
    tags: ["Food", "Culture", "Outdoor"],
    tiers: [
      { id: "t3a", name: "Day Pass", price: 35, remaining: 400, total: 800, description: "Full day general access" },
      { id: "t3b", name: "Chef's Table", price: 120, remaining: 15, total: 30, description: "Private chef demo + 5-course tasting" },
    ],
    rating: 4.7,
    reviewCount: 427,
    featured: false,
    status: "upcoming",
  },
  {
    id: "e4",
    title: "Impressionist Art Exhibition: Light & Shadow",
    description: "A curated collection of 200 masterworks from the Impressionist era. Interactive AI guide, artist talks, and guided evening tours.",
    category: "Art",
    date: "2026-03-28",
    time: "10:00 AM",
    venue: "Metropolitan Gallery",
    address: "789 Museum Mile",
    city: "Boston, MA",
    lat: 42.3601,
    lng: -71.0589,
    distance: 3.1,
    organizer: "Arts Foundation",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1602726859144-2bb8c9de3c5c?w=800&auto=format&fit=crop",
    tags: ["Art", "Culture", "Exhibition"],
    tiers: [
      { id: "t4a", name: "Adult", price: 25, remaining: 300, total: 500, description: "Standard entry" },
      { id: "t4b", name: "Premium", price: 65, remaining: 40, total: 80, description: "Private guided tour + exhibition catalog" },
    ],
    rating: 4.6,
    reviewCount: 203,
    featured: false,
    status: "upcoming",
  },
  {
    id: "e5",
    title: "Yoga & Wellness Retreat in the Mountains",
    description: "3-day immersive wellness retreat featuring sunrise yoga, meditation sessions, sound healing, and organic farm-to-table meals.",
    category: "Wellness",
    date: "2026-04-11",
    time: "8:00 AM",
    venue: "Blue Ridge Mountain Retreat",
    address: "Appalachian Trail Rd",
    city: "Asheville, NC",
    lat: 35.5951,
    lng: -82.5515,
    distance: 5.7,
    organizer: "Zenith Wellness",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
    tags: ["Wellness", "Yoga", "Nature"],
    tiers: [
      { id: "t5a", name: "Day Visitor", price: 75, remaining: 50, total: 100, description: "Single day access" },
      { id: "t5b", name: "Full Retreat", price: 450, remaining: 12, total: 40, description: "All 3 days + accommodation + meals" },
    ],
    rating: 5.0,
    reviewCount: 87,
    featured: true,
    status: "upcoming",
  },
  {
    id: "e6",
    title: "Jazz Under the Stars",
    description: "An elegant outdoor jazz concert series featuring Grammy-nominated artists, craft cocktails, and a picnic-style seating experience under the open sky.",
    category: "Music",
    date: "2026-04-18",
    time: "7:30 PM",
    venue: "Riverside Amphitheater",
    address: "300 River Walk Blvd",
    city: "New Orleans, LA",
    lat: 29.9511,
    lng: -90.0715,
    distance: 1.9,
    organizer: "Soulful Sounds",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&auto=format&fit=crop",
    tags: ["Jazz", "Music", "Outdoor"],
    tiers: [
      { id: "t6a", name: "Lawn", price: 55, remaining: 180, total: 300, description: "Open lawn seating" },
      { id: "t6b", name: "Reserved", price: 110, remaining: 35, total: 80, description: "Reserved table for two with welcome drinks" },
    ],
    rating: 4.8,
    reviewCount: 156,
    featured: false,
    status: "upcoming",
  },
  {
    id: "e7",
    title: "Game Dev Workshop: Build Your Indie Game",
    description: "An intensive 2-day workshop where you build a complete indie game from scratch using Unity. Mentored by industry veterans. Take home your finished project.",
    category: "Tech",
    date: "2026-03-30",
    time: "10:00 AM",
    venue: "Maker Space HQ",
    address: "222 Creator Ave",
    city: "Austin, TX",
    lat: 30.2672,
    lng: -97.7431,
    distance: 4.3,
    organizer: "Code & Play",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&auto=format&fit=crop",
    tags: ["Tech", "Workshops", "Gaming"],
    tiers: [
      { id: "t7a", name: "Workshop", price: 199, remaining: 25, total: 40, description: "Full 2-day workshop with materials" },
    ],
    rating: 4.9,
    reviewCount: 64,
    featured: false,
    status: "upcoming",
  },
  {
    id: "e8",
    title: "Fashion Week: Emerging Designers Showcase",
    description: "Discover the next generation of fashion talent. 20 emerging designers present their debut collections on the runway, followed by a VIP reception.",
    category: "Art",
    date: "2026-04-22",
    time: "6:00 PM",
    venue: "Design District Gallery",
    address: "88 Fashion Row",
    city: "Los Angeles, CA",
    lat: 34.0522,
    lng: -118.2437,
    distance: 2.8,
    organizer: "Thread & Vision",
    organizerId: "u2",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    tags: ["Fashion", "Art", "Creatives"],
    tiers: [
      { id: "t8a", name: "Runway", price: 89, remaining: 120, total: 200, description: "Front-row runway access" },
      { id: "t8b", name: "Designer VIP", price: 250, remaining: 8, total: 20, description: "Meet designers + exclusive reception" },
    ],
    rating: 4.7,
    reviewCount: 93,
    featured: true,
    status: "upcoming",
  },
];

// ─── Bookings ─────────────────────────────────────────────────────────────

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1", eventId: "e1", eventTitle: "Neon Nights Electronic Festival",
    eventDate: "Mar 15, 2026", eventVenue: "Skyline Arena, Miami FL",
    userId: "u1", tierName: "VIP", quantity: 2, total: 298,
    status: "confirmed", bookedAt: "2026-02-10", qrCode: "QR-PLANZO-B1-U1",
  },
  {
    id: "b2", eventId: "e2", eventTitle: "Startup Founders Summit 2026",
    eventDate: "Mar 22, 2026", eventVenue: "Innovation Hub, SF CA",
    userId: "u1", tierName: "Founder Pass", quantity: 1, total: 599,
    status: "confirmed", bookedAt: "2026-02-14", qrCode: "QR-PLANZO-B2-U1",
  },
  {
    id: "b3", eventId: "e3", eventTitle: "Culinary World Tour",
    eventDate: "Apr 5, 2026", eventVenue: "Central Park, NYC",
    userId: "u1", tierName: "Day Pass", quantity: 3, total: 105,
    status: "pending", bookedAt: "2026-02-20", qrCode: "QR-PLANZO-B3-U1",
  },
];

// ─── Revenue ──────────────────────────────────────────────────────────────

export const MOCK_REVENUE: RevenueRecord[] = [
  { id: "r1", eventTitle: "Neon Nights Electronic Festival", organizer: "Pulse Events Co.", gross: 48750, commission: 4875, payout: 43875, status: "paid", date: "2026-02-15" },
  { id: "r2", eventTitle: "Startup Founders Summit 2026", organizer: "TechCircle Inc.", gross: 62300, commission: 6230, payout: 56070, status: "processing", date: "2026-02-18" },
  { id: "r3", eventTitle: "Culinary World Tour", organizer: "Flavor Collective", gross: 28500, commission: 2850, payout: 25650, status: "pending", date: "2026-02-20" },
  { id: "r4", eventTitle: "Jazz Under the Stars", organizer: "Soulful Sounds", gross: 19800, commission: 1980, payout: 17820, status: "paid", date: "2026-02-08" },
  { id: "r5", eventTitle: "Yoga & Wellness Retreat", organizer: "Zenith Wellness", gross: 24750, commission: 2475, payout: 22275, status: "paid", date: "2026-02-01" },
  { id: "r6", eventTitle: "Fashion Week Showcase", organizer: "Thread & Vision", gross: 16050, commission: 1605, payout: 14445, status: "pending", date: "2026-02-22" },
];

// ─── Analytics ────────────────────────────────────────────────────────────

export const MOCK_ANALYTICS: AnalyticsMetric[] = [
  { month: "Sep", ticketsSold: 1200, revenue: 58000, attendees: 980, newUsers: 340 },
  { month: "Oct", ticketsSold: 1850, revenue: 87000, attendees: 1540, newUsers: 520 },
  { month: "Nov", ticketsSold: 2100, revenue: 102000, attendees: 1820, newUsers: 610 },
  { month: "Dec", ticketsSold: 2800, revenue: 134000, attendees: 2430, newUsers: 780 },
  { month: "Jan", ticketsSold: 2200, revenue: 108000, attendees: 1920, newUsers: 590 },
  { month: "Feb", ticketsSold: 3100, revenue: 152000, attendees: 2780, newUsers: 940 },
  { month: "Mar", ticketsSold: 3800, revenue: 189000, attendees: 3400, newUsers: 1100 },
];

export const CATEGORY_DATA = [
  { name: "Music", value: 35, fill: "#4ade80" },
  { name: "Tech", value: 25, fill: "#22c55e" },
  { name: "Food", value: 18, fill: "#86efac" },
  { name: "Art", value: 12, fill: "#bbf7d0" },
  { name: "Wellness", value: 10, fill: "#d1fae5" },
];

// ─── Campaigns ────────────────────────────────────────────────────────────

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "March Music Blast", type: "email", event: "Neon Nights Festival", sent: 8400, opened: 3276, clicked: 1512, revenue: 18900, status: "active", date: "2026-02-15" },
  { id: "c2", name: "Founders Summit Push", type: "push", event: "Startup Summit", sent: 5200, opened: 2496, clicked: 936, revenue: 24600, status: "completed", date: "2026-02-10" },
  { id: "c3", name: "Food Fest Featured", type: "featured", event: "Culinary World Tour", sent: 0, opened: 0, clicked: 4320, revenue: 8750, status: "active", date: "2026-02-18" },
  { id: "c4", name: "Spring Wellness Campaign", type: "email", event: "Yoga Retreat", sent: 3100, opened: 1240, clicked: 558, revenue: 11250, status: "draft", date: "2026-02-22" },
];
