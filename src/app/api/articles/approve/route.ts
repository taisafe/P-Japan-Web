import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchFullArticleContent } from '@/lib/scraper/browser';
import { translationService } from '@/lib/services/translator';
import { processArticle } from '@/lib/services/event-manager';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const { articleId } = await request.json();

        if (!articleId) {
            return NextResponse.json({ success: false, error: 'Missing articleId' }, { status: 400 });
        }

        // 1. Get the article
        const article = await db.query.articles.findFirst({
            where: eq(articles.id, articleId),
            with: { source: true },
        });

        if (!article) {
            return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        }

        if (article.status !== 'candidate') {
            return NextResponse.json({ success: false, error: 'Article is not a candidate' }, { status: 400 });
        }

        // 2. Fetch full content using Puppeteer
        await logger.info(`Approving article: ${article.title}`, 'ARTICLE_APPROVE', { articleId });

        const fullContent = await fetchFullArticleContent(article.url);

        if (!fullContent || !fullContent.content) {
            await logger.warn(`Failed to fetch content for article: ${article.url}`, 'ARTICLE_APPROVE', { articleId });
            // Still approve but with empty content
        }

        // 3. Update article with content
        await db.update(articles)
            .set({
                content: fullContent?.content || null,
                author: fullContent?.author || article.author,
                description: fullContent?.description || article.description,
                status: 'published',
                publishedAt: new Date(),
            })
            .where(eq(articles.id, articleId));

        // 4. Translate content (if Japanese source)
        const source = article.source;
        if (source?.type === 'jp' && fullContent?.content) {
            try {
                await translationService.translateArticle(articleId);
            } catch (e: any) {
                await logger.warn(`Content translation failed: ${e.message}`, 'ARTICLE_APPROVE', { articleId });
            }
        }

        // 5. Trigger event processing
        try {
            const updatedArticle = await db.query.articles.findFirst({
                where: eq(articles.id, articleId),
            });
            if (updatedArticle) {
                await processArticle(updatedArticle as any);
            }
        } catch (e: any) {
            await logger.warn(`Event processing failed: ${e.message}`, 'ARTICLE_APPROVE', { articleId });
        }

        await logger.info(`Article approved successfully: ${article.title}`, 'ARTICLE_APPROVE', { articleId });

        return NextResponse.json({
            success: true,
            message: 'Article approved and published',
            articleId,
        });

    } catch (error: any) {
        console.error('Approve error:', error);
        await logger.error(`Approve failed: ${error.message}`, 'ARTICLE_APPROVE');
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
