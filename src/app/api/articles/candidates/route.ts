import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles, sources } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        const candidates = await db.select({
            id: articles.id,
            title: articles.title,
            titleCN: articles.titleCN,
            url: articles.url,
            sourceId: articles.sourceId,
            sourceName: sources.name,
            sourceType: sources.type,
            createdAt: articles.createdAt,
        })
            .from(articles)
            .leftJoin(sources, eq(articles.sourceId, sources.id))
            .where(eq(articles.status, 'candidate'))
            .orderBy(desc(articles.createdAt))
            .limit(100);

        return NextResponse.json(candidates);
    } catch (error: any) {
        console.error('Fetch candidates error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
