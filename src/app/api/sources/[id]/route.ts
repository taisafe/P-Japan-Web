import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// PATCH endpoint for updating source details
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Validate that we are not trying to update fields that shouldn't be touched or perform validation if needed
        // For now, trust the input but ensure we don't overwrite id or createdAt
        const { id: _, createdAt, ...updates } = body;

        await db.update(sources)
            .set({
                ...updates,
                // Ensure deletedAt is not accidentally set if it was null, unless explicitly desired (which usually isn't via PATCH)
            })
            .where(eq(sources.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PATCH Source Error:", error);
        return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Soft delete: keep the record and data, just mark as deleted and inactive
        await db.update(sources)
            .set({
                deletedAt: new Date(),
                isActive: false
            })
            .where(eq(sources.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Source Error:", error);
        return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
    }
}
