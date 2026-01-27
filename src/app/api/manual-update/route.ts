import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { fetchAllRssSources } from '@/lib/scraper/rss';

export async function POST(request: Request) {
    const updateId = uuidv4();
    const source = 'MANUAL_UPDATE_API';

    try {
        await logger.info(`Manual update started. ID: ${updateId}`, source);

        // Execute RSS Fetch
        await fetchAllRssSources(updateId);

        await logger.info(`Manual update completed successfully. ID: ${updateId}`, source);

        await logger.info(`Manual update completed successfully. ID: ${updateId}`, source);

        return NextResponse.json({ success: true, message: 'Update completed', updateId });
    } catch (error: any) {
        await logger.error(`Manual update failed: ${error.message}`, source);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
