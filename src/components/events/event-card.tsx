"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeatScoreBadge } from "@/components/events/heat-score-badge";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { events, articles, sources } from "@/lib/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import { getScoreBreakdown } from "@/lib/services/scoring";

type Event = InferSelectModel<typeof events>;
type Article = InferSelectModel<typeof articles> & {
    source?: InferSelectModel<typeof sources> | null;
};

interface EventCardProps {
    event: Event;
    articles: Article[];
}

export function EventCard({ event, articles }: EventCardProps) {
    // Calculate score breakdown for tooltip
    const articlesWithSources = articles.map(a => ({
        id: a.id,
        sourceId: a.sourceId,
        matchStatus: a.matchStatus as 'confirmed' | 'pending' | 'rejected' | null,
        publishedAt: a.publishedAt,
        source: a.source ? { id: a.source.id, weight: a.source.weight } : null,
    }));

    const breakdown = getScoreBreakdown(event, articlesWithSources);

    return (
        <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                            {event.summary}
                        </CardDescription>
                    </div>
                    <HeatScoreBadge score={event.heatScore} breakdown={breakdown} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    最後更新: {event.lastUpdatedAt ? formatDistanceToNow(event.lastUpdatedAt, { addSuffix: true, locale: zhTW }) : 'N/A'}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {articles.map(article => (
                        <div key={article.id} className="border-l-2 border-muted pl-3 py-1">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline block leading-snug">
                                {article.title}
                            </a>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                <span className="font-semibold text-editorial-pink">{article.source?.name || article.sourceId}</span>
                                <span>•</span>
                                <span>{article.publishedAt ? formatDistanceToNow(article.publishedAt, { addSuffix: true, locale: zhTW }) : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

