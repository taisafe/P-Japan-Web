import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.delete(sources).where(eq(sources.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Source Error:", error);
        return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
    }
}
