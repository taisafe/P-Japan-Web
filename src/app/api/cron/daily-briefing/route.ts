import { NextResponse } from 'next/server';
import { fetchAllRssSources } from '@/lib/scraper/rss';
import { briefingService } from '@/lib/services/briefing';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    // 1. Authorization Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runId = uuidv4();
    try {
        await logger.info('CronJob Triggered: Daily Briefing', 'CRON', { runId });

        // 2. Fetch Latest News (RSS)
        // This processes articles and creates events due to our modification in rss.ts
        const fetchResult = await fetchAllRssSources(runId);

        await logger.info(`RSS Fetch Completed: ${fetchResult.totalNew} new articles`, 'CRON', { runId, ...fetchResult });

        // 3. Generate Briefing
        // Get candidates from last 24h
        const candidates = await briefingService.getCandidates(24);

        if (candidates.length === 0) {
            await logger.warn('No event candidates for briefing', 'CRON', { runId });
            return NextResponse.json({ message: 'No events found', fetchResult });
        }

        // Take top 10 events by heat score for the briefing
        const topEvents = candidates.slice(0, 10).map(c => c.id);

        const briefingResult = await briefingService.generateBriefing(topEvents);

        if (briefingResult.success && briefingResult.content) {
            await logger.info('Daily Briefing Generated Successfully', 'CRON', { runId });
            // Ideally we save this to a 'briefings' table, but for now we log it or rely on the UI 'Latest Briefing' logic if it exists.
            // Since we don't have a briefings table in the schema, logging it to system logs acts as storage for now.
            await logger.info(briefingResult.content.substring(0, 200) + '...', 'CRON_RESULT', { fullContent: briefingResult.content });
        } else {
            await logger.error(`Briefing Generation Failed: ${briefingResult.error}`, 'CRON', { runId });
            return NextResponse.json({ error: briefingResult.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Daily Briefing Cycle Completed',
            fetchResult,
            briefingLength: briefingResult.content?.length
        });

    } catch (error) {
        console.error('Cron Job Failed:', error);
        await logger.error('Cron Job Failed', 'CRON', { error: String(error), runId });
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
