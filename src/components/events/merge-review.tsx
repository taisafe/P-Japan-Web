import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveMerge } from "./actions";
import { Split } from "lucide-react";

export async function MergeReview() {
    const pendingArticles = await db.query.articles.findMany({
        where: eq(articles.matchStatus, 'pending'),
        with: { event: true },
        limit: 5
    });

    if (pendingArticles.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 mb-8 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-700 text-lg">
                    <Split className="h-5 w-5" />
                    待確認的合併建議 ({pendingArticles.length})
                </CardTitle>
                <CardDescription>
                    系統發現以下文章可能屬於現有事件，但信心分數未達自動合併門檻，請人工確認。
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
                {pendingArticles.map(article => (
                    <div key={article.id} className="flex flex-col md:flex-row gap-4 items-start bg-background p-4 rounded border shadow-sm">
                        <div className="flex-1 space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">
                                建議合併至事件: <span className="text-foreground font-bold underline decoration-editorial-pink decoration-2 underline-offset-2">{article.event?.title}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-tight">{article.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.description}</p>
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-3">
                                <span className="bg-muted px-1.5 py-0.5 rounded">相似度: {(article.matchConfidence || 0).toFixed(2)}</span>
                                <span className="bg-muted px-1.5 py-0.5 rounded">來源: {article.sourceId}</span>
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                            <form action={resolveMerge.bind(null, article.id, 'approve')} className="w-full">
                                <Button size="sm" variant="default" className="w-full bg-green-600 hover:bg-green-700 h-9">
                                    確認合併
                                </Button>
                            </form>
                            <form action={resolveMerge.bind(null, article.id, 'reject')} className="w-full">
                                <Button size="sm" variant="outline" className="w-full h-9">
                                    分離為新事件
                                </Button>
                            </form>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
