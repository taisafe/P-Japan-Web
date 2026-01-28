import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const { articleId } = await request.json();

        if (!articleId) {
            return NextResponse.json({ success: false, error: 'Missing articleId' }, { status: 400 });
        }

        // Get article to verify it exists
        const article = await db.query.articles.findFirst({
            where: eq(articles.id, articleId),
        });

        if (!article) {
            return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        }

        // Update status to rejected
        await db.update(articles)
            .set({ status: 'rejected' })
            .where(eq(articles.id, articleId));

        await logger.info(`Article rejected: ${article.title}`, 'ARTICLE_REJECT', { articleId });

        return NextResponse.json({
            success: true,
            message: 'Article rejected',
            articleId,
        });

    } catch (error: any) {
        console.error('Reject error:', error);
        await logger.error(`Reject failed: ${error.message}`, 'ARTICLE_REJECT');
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
