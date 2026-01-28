import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { isNull } from "drizzle-orm";

export async function GET() {
    try {
        const allSources = await db.select()
            .from(sources)
            .where(isNull(sources.deletedAt));
        return NextResponse.json(allSources);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newSource = {
            ...body,
            id: uuidv4(),
        };
        await db.insert(sources).values(newSource);
        return NextResponse.json(newSource);
    } catch (error) {
        console.error("POST Source Error:", error);
        return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }
}
