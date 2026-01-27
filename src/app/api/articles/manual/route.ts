import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { translationService } from '@/lib/services/translator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, url, content, author, isPaywalled, publishedAt } = body;

        // Auto translate title if not provided
        let titleCN = body.titleCN;
        if (!titleCN && title) {
            try {
                titleCN = await translationService.translateTitle(title);
            } catch (err) {
                console.warn("Auto-translation failed, falling back to original title:", err);
                titleCN = title;
            }
        }

        const newArticle = {
            id: uuidv4(),
            title,
            url,
            content,
            author,
            isPaywalled: Boolean(isPaywalled),
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
            titleCN: titleCN,
            createdAt: new Date(),
        };

        await db.insert(articles).values(newArticle);
        return NextResponse.json(newArticle);
    } catch (error: any) {
        console.error("POST Manual Article Error:", error);

        // Handle unique constraint violation for URL
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
            return NextResponse.json({ error: "Article with this URL already exists" }, { status: 409 });
        }

        return NextResponse.json({ error: "Failed to save manually entered content" }, { status: 500 });
    }
}
