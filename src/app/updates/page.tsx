
import { ArticlesService } from "@/lib/services/articles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { Newspaper, Calendar, Globe } from "lucide-react";
import { DateTimeline } from "@/components/ui/timeline";
import { ArticleActions } from "@/components/updates/article-actions";
import { ArticleList } from "@/components/updates/article-list";

export default async function UpdatesPage({
    searchParams,
}: {
    searchParams: { page?: string; date?: string };
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const date = params.page && params.date ? params.date as string : params.date as string || undefined;
    const limit = 20;

    const service = new ArticlesService();
    // Get available dates for timeline
    const availableDates = await service.getAvailableDates();

    // List articles with date filter if present
    const { data: articles, total, totalPages } = await service.list({ page, limit, date });

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                    <Newspaper className="h-8 w-8 text-editorial-pink" />
                    最新動態
                </h1>
                <p className="text-muted-foreground text-lg">
                    即時收錄的日本政治新聞與社群動態，所有內容皆已本地存檔。
                </p>
            </div>

            <DateTimeline availableDates={availableDates} currentDate={date} />

            <ArticleList articles={articles} />

            {/* Simple Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    {page > 1 && (
                        <Link href={`/updates?page=${page - 1}${date ? `&date=${date}` : ''}`} className="px-4 py-2 border rounded hover:bg-muted">
                            上一頁
                        </Link>
                    )}
                    <span className="px-4 py-2 text-muted-foreground">
                        第 {page} / {totalPages} 頁
                    </span>
                    {page < totalPages && (
                        <Link href={`/updates?page=${page + 1}${date ? `&date=${date}` : ''}`} className="px-4 py-2 border rounded hover:bg-muted">
                            下一頁
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
