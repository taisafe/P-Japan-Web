import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const logs = await db.select()
            .from(systemLogs)
            .orderBy(desc(systemLogs.createdAt))
            .limit(limit);

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
