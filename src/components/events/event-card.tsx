import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { events, articles } from "@/lib/db/schema";
import { type InferSelectModel } from "drizzle-orm";

type Event = InferSelectModel<typeof events>;
type Article = InferSelectModel<typeof articles>;

interface EventCardProps {
    event: Event;
    articles: Article[];
}

export function EventCard({ event, articles }: EventCardProps) {
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
                    <Badge variant="outline" className="ml-2 whitespace-nowrap">
                        🔥 {event.heatScore?.toFixed(1) || 0}
                    </Badge>
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
                                <span className="font-semibold text-editorial-pink">{article.sourceId}</span>
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
