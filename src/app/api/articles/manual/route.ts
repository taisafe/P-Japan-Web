import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newArticle = {
            ...body,
            id: uuidv4(),
            createdAt: new Date(),
        };
        await db.insert(articles).values(newArticle);
        return NextResponse.json(newArticle);
    } catch (error) {
        console.error("POST Manual Article Error:", error);
        return NextResponse.json({ error: "Failed to save manually entered content" }, { status: 500 });
    }
}
