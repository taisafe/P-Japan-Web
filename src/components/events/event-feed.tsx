import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { EventCard } from "./event-card";

export async function EventFeed() {
    const allEvents = await db.query.events.findMany({
        orderBy: [desc(events.lastUpdatedAt)],
        limit: 20,
        with: {
            articles: {
                orderBy: (articles, { desc }) => [desc(articles.publishedAt)],
            }
        },
        where: (events, { eq }) => eq(events.status, 'active')
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">最新動態</h2>
            {allEvents.map(event => (
                <EventCard key={event.id} event={event} articles={event.articles} />
            ))}
            {allEvents.length === 0 && (
                <div className="text-center text-muted-foreground py-10 border rounded-lg bg-muted/20">
                    尚無追蹤事件。請等待資料蒐集或手動錄入。
                </div>
            )}
        </div>
    );
}
