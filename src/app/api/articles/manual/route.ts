import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { translationService } from '@/lib/services/translator';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Auto translate title if not provided
        let titleCN = body.titleCN;
        if (!titleCN && body.title) {
            try {
                titleCN = await translationService.translateTitle(body.title);
            } catch (err) {
                console.warn("Auto-translation failed, falling back to original title:", err);
                titleCN = body.title;
            }
        }

        const newArticle = {
            ...body,
            id: uuidv4(),
            titleCN: titleCN,
            createdAt: new Date(),
        };
        await db.insert(articles).values(newArticle);
        return NextResponse.json(newArticle);
    } catch (error) {
        console.error("POST Manual Article Error:", error);
        return NextResponse.json({ error: "Failed to save manually entered content" }, { status: 500 });
    }
}
