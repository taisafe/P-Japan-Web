import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { fetchAllCandidates } from '@/lib/scraper/browser';

export async function POST(request: Request) {
    const updateId = uuidv4();
    const source = 'MANUAL_UPDATE_API';

    try {
        await logger.info(`Manual update started. ID: ${updateId}`, source);

        const body = await request.json().catch(() => ({}));
        const { sourceIds } = body;

        // Execute Browser-based Candidate Fetch
        const result = await fetchAllCandidates(updateId, sourceIds);

        await logger.info(`Manual update completed successfully. ID: ${updateId}`, source);

        return NextResponse.json({
            success: true,
            message: 'Candidate fetch completed',
            updateId,
            newCandidates: result.totalNew,
            errors: result.totalErrors,
        });
    } catch (error: any) {
        await logger.error(`Manual update failed: ${error.message}`, source);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
