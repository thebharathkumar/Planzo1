import { getRedis } from "./redis";
import { MOCK_EVENTS, MOCK_BOOKINGS, MOCK_CAMPAIGNS, MOCK_REVENUE, MOCK_ANALYTICS } from "../../src/app/mock-data";

const SEED_MARKER = "planzo:seed:v1";

export async function ensureSeed(): Promise<void> {
    const redis = getRedis();
    const seeded = await redis.get(SEED_MARKER);
    if (seeded) return;

    const pipe = redis.pipeline();

    for (const event of MOCK_EVENTS) {
        pipe.set(`event:${event.id}`, event);
        pipe.sadd(`events:byOrganizer:${event.organizerId}`, event.id);
        pipe.sadd("events:all", event.id);
        const tickets = event.tiers.reduce((s, t) => s + (t.total - t.remaining), 0);
        const revenue = event.tiers.reduce((s, t) => s + (t.total - t.remaining) * t.price, 0);
        pipe.set(`event:${event.id}:views`, tickets * 12);
        pipe.set(`event:${event.id}:clicks`, tickets * 4);
        pipe.set(`event:${event.id}:ticketsSold`, tickets);
        pipe.set(`event:${event.id}:revenue`, revenue);
        pipe.set(`event:${event.id}:refunds`, 0);
    }

    for (const booking of MOCK_BOOKINGS) {
        pipe.set(`booking:${booking.id}`, booking);
        pipe.sadd(`bookings:byUser:${booking.userId}`, booking.id);
        pipe.sadd(`bookings:byEvent:${booking.eventId}`, booking.id);
    }

    for (const campaign of MOCK_CAMPAIGNS) {
        const matchedEvent = MOCK_EVENTS.find((e) => e.title === campaign.event);
        const linkedEventId = matchedEvent?.id ?? "e1";
        const linkedEventTitle = matchedEvent?.title ?? campaign.event;
        const reshaped = {
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            eventId: linkedEventId,
            eventTitle: linkedEventTitle,
            audience: "all-users",
            content: "",
            startDate: campaign.date,
            endDate: campaign.date,
            status: campaign.status === "completed" ? "completed" : campaign.status,
            sent: campaign.sent,
            opened: campaign.opened,
            clicked: campaign.clicked,
            revenue: campaign.revenue,
            createdBy: "u5",
            createdAt: campaign.date + "T00:00:00.000Z",
            updatedAt: campaign.date + "T00:00:00.000Z",
        };
        pipe.set(`campaign:${campaign.id}`, reshaped);
        pipe.sadd("campaigns:all", campaign.id);
        pipe.sadd("campaigns:byUser:u5", campaign.id);
        pipe.set(`campaign:${campaign.id}:impressions`, campaign.sent);
        pipe.set(`campaign:${campaign.id}:opens`, campaign.opened);
        pipe.set(`campaign:${campaign.id}:clicks`, campaign.clicked);
        pipe.set(`campaign:${campaign.id}:revenue`, campaign.revenue);
        pipe.set(`campaign:${campaign.id}:bookings`, Math.floor(campaign.revenue / 100));
    }

    for (const rev of MOCK_REVENUE) {
        pipe.set(`revenue:${rev.id}`, rev);
        pipe.sadd("revenue:all", rev.id);
    }

    pipe.set("analytics:platform", MOCK_ANALYTICS);
    pipe.set(SEED_MARKER, new Date().toISOString());

    await pipe.exec();
}
