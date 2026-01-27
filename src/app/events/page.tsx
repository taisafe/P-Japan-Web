
import { EventsService } from "@/lib/services/events";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { Flame, Activity, ArrowUpRight } from "lucide-react";

export default async function EventsPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    const service = new EventsService();
    const { data: events, total, totalPages } = await service.list({ page });

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                    <Flame className="h-8 w-8 text-orange-500" />
                    事件追蹤
                </h1>
                <p className="text-muted-foreground text-lg">
                    AI 自動歸納的政治事件熱點與發展軌跡。
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        目前沒有追蹤中的事件。
                    </div>
                ) : (
                    events.map((event) => (
                        <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-orange-500 overflow-hidden">
                            <CardHeader className="bg-muted/10 pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl leading-tight font-bold group-hover:text-orange-600 transition-colors">
                                        <Link href={`/updates?query=${encodeURIComponent(event.title)}`} className="hover:underline">
                                            {event.title}
                                        </Link>
                                    </CardTitle>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="secondary" className="font-mono text-orange-600 bg-orange-100 dark:bg-orange-900/30">
                                            <Activity className="h-3 w-3 mr-1" />
                                            {event.heatScore?.toFixed(1) || 0}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                    {event.summary}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="font-medium bg-muted px-2 py-0.5 rounded">
                                            {event.articleCount} 篇報導
                                        </span>
                                        <span>
                                            最後更新: {event.lastUpdatedAt ? format(event.lastUpdatedAt, "MM/dd HH:mm", { locale: zhTW }) : "-"}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-muted-foreground mb-1">最新關聯:</div>
                                        {event.articles && event.articles.slice(0, 3).map((article) => (
                                            <Link href={`/updates/${article.id}`} key={article.id} className="block">
                                                <div className="flex items-center gap-2 text-sm hover:text-orange-600 transition-colors truncate">
                                                    <ArrowUpRight className="h-3 w-3 min-w-3" />
                                                    <span className="truncate">{article.title}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-8">
                    {page > 1 && (
                        <Link href={`/events?page=${page - 1}`} className="px-4 py-2 border rounded hover:bg-muted">
                            上一頁
                        </Link>
                    )}
                    <span className="px-4 py-2 text-muted-foreground">
                        第 {page} / {totalPages} 頁
                    </span>
                    {page < totalPages && (
                        <Link href={`/events?page=${page + 1}`} className="px-4 py-2 border rounded hover:bg-muted">
                            下一頁
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
