'use server';

import { briefingService } from '@/lib/services/briefing';

export async function getBriefingCandidatesAction() {
    try {
        const candidates = await briefingService.getCandidates();
        return { success: true, data: candidates };
    } catch (error) {
        console.error('Failed to fetch briefing candidates:', error);
        return { success: false, error: 'Failed to fetch candidates' };
    }
}

export async function generateBriefingAction(eventIds: string[]) {
    try {
        const result = await briefingService.generateBriefing(eventIds);
        return result;
    } catch (error) {
        console.error('Failed to generate briefing:', error);
        return { success: false, error: 'Failed to generate briefing' };
    }
}
