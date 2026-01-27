
import { ArticlesService } from "@/lib/services/articles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { Newspaper, Calendar, Globe } from "lucide-react";

export default async function UpdatesPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 20;

    const service = new ArticlesService();
    const { data: articles, total, totalPages } = await service.list({ page, limit });

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

            <div className="grid gap-4">
                {articles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        目前沒有最新動態。請前往「情報來源」執行抓取。
                    </div>
                ) : (
                    articles.map((article) => (
                        <Link href={`/updates/${article.id}`} key={article.id} className="block group">
                            <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-editorial-pink">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold group-hover:text-editorial-pink transition-colors line-clamp-2 leading-tight">
                                                    {article.titleCN || article.title}
                                                </h3>
                                                {article.titleCN && (
                                                    <p className="text-sm text-muted-foreground font-medium line-clamp-1 opacity-80 group-hover:opacity-100">
                                                        {article.title}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground hover:bg-muted">
                                                    {article.source?.name || "Unknown Source"}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {article.publishedAt ? format(article.publishedAt, "PPP p", { locale: zhTW }) : "未知時間"}
                                                </span>
                                            </div>

                                            {article.tags && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {/* Need to parse tags if it's a string, Drizzle mode:'json' gives object/array but we should verify */}
                                                    {Array.isArray(article.tags) && article.tags.map((tag: string) => (
                                                        <Badge key={tag} variant="outline" className="text-xs text-editorial-pink border-editorial-pink/30">
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {article.source?.type === 'twitter' && (
                                            <div className="hidden md:flex items-center justify-center w-16 text-sky-500">
                                                {/* Could use Twitter icon */}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Simple Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    {page > 1 && (
                        <Link href={`/updates?page=${page - 1}`} className="px-4 py-2 border rounded hover:bg-muted">
                            上一頁
                        </Link>
                    )}
                    <span className="px-4 py-2 text-muted-foreground">
                        第 {page} / {totalPages} 頁
                    </span>
                    {page < totalPages && (
                        <Link href={`/updates?page=${page + 1}`} className="px-4 py-2 border rounded hover:bg-muted">
                            下一頁
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
