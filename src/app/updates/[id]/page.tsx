
import { ArticlesService } from "@/lib/services/articles";
import { ArticleDetailClient } from "./article-detail-client";

export default async function ArticleDetailPage({
    params,
}: {
    params: { id: string };
}) {
    // In Next.js 15+, params is a Promise
    const { id } = await params;

    const service = new ArticlesService();
    const article = await service.get(id);

    if (!article) {
        return <div className="p-8 text-center text-muted-foreground">找不到文章</div>;
    }

    return <ArticleDetailClient article={article} />;
}
