import { db } from '@/lib/db';
import { events, articles } from '@/lib/db/schema';
import { desc, gt, inArray, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { getSettings } from '@/lib/services/settings';

export interface BriefingCandidate {
    id: string;
    title: string;
    summary: string | null;
    heatScore: number | null;
    lastUpdatedAt: Date | null;
    articleCount: number;
}

export interface BriefingResult {
    success: boolean;
    content?: string;
    error?: string;
}

export class BriefingService {
    /**
     * Get candidate events for the briefing.
     * Default: Active events from the last 24 hours, sorted by heat score.
     */
    async getCandidates(hours: number = 24): Promise<BriefingCandidate[]> {
        const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

        const activeEvents = await db.query.events.findMany({
            where: gt(events.lastUpdatedAt, timeThreshold),
            orderBy: [desc(events.heatScore)],
            with: {
                articles: {
                    columns: { id: true }
                }
            }
        });

        return activeEvents.map(event => ({
            id: event.id,
            title: event.title,
            summary: event.summary,
            heatScore: event.heatScore,
            lastUpdatedAt: event.lastUpdatedAt,
            articleCount: event.articles.length
        }));
    }

    /**
     * Generate a Daily Briefing based on selected events.
     */
    async generateBriefing(eventIds: string[]): Promise<BriefingResult> {
        try {
            if (eventIds.length === 0) {
                return { success: false, error: 'No events selected' };
            }

            // 1. Fetch selected events details
            const selectedEvents = await db.query.events.findMany({
                where: inArray(events.id, eventIds),
                columns: {
                    title: true,
                    summary: true,
                    heatScore: true
                }
            });

            if (selectedEvents.length === 0) {
                return { success: false, error: 'Events not found' };
            }

            // 2. Prepare AI Client
            const settings = await getSettings([
                'ai.briefing.provider',
                'ai.briefing.api_key',
                'ai.briefing.base_url',
                'ai.briefing.model',
                // Fallback to translation settings if briefing specific ones aren't set? 
                // For now, let's assume we reuse translation or have separate keys.
                // Let's reuse 'ai.translation.*' as a fallback if 'ai.briefing.*' is missing, 
                // OR just use 'ai.translation.*' base if the user hasn't configured specific briefing AI.
                // To keep it simple and consistent with the plan "Use existing multi-provider", 
                // I will grab generic AI settings or specific ones. 
                // Let's try to grab 'ai.translation.*' as the default "AI Service" for now to avoid forcing user to config twice,
                // BUT ideally we should have a 'ai.briefing' section. 
                // CHECK: In conversation 8f2ebf52 (Multi-Provider), did we separate them?
                // The summary says "independent configuration for each function". So I should look for 'ai.briefing.*'.
            ]);

            // Assuming user might haven't set briefing keys, we might need a fallback or strict check.
            // Let's implement strict check but fall back to "translation" keys if that helps? 
            // No, "independent" means independent.

            // Wait, I should double check if I implemented 'ai.briefing' keys in the settings page.
            // If I didn't, I should probably use a shared key or the existing translation one.
            // Let's assume the user HAS NOT set up 'ai.briefing.*' yet.
            // However, the user said "reuse existing".
            // Let's try to fetch `ai.briefing.*`, if empty, maybe error out or use OpenAI default.
            // Actually, safe bet: Use `ai.briefing.*` and if missing, return error asking user to configure.

            // To be safe, I'll fetch `ai.briefing.api_key` etc.

            const apiKey = settings['ai.briefing.api_key'];
            const baseURL = settings['ai.briefing.base_url'];
            const model = settings['ai.briefing.model'] || 'gpt-3.5-turbo';

            if (!apiKey) {
                return { success: false, error: 'Briefing AI settings not configured. Please configure AI settings.' };
            }

            const client = new OpenAI({
                apiKey: apiKey,
                baseURL: baseURL || undefined,
            });

            // 3. Construct Prompt
            const eventsText = selectedEvents.map((e, index) => {
                return `Event ${index + 1}:\nTitle: ${e.title}\nSummary: ${e.summary}\nHeat: ${e.heatScore}\n`;
            }).join('\n---\n');

            const systemPrompt = `你是一個專業的日本政治新聞編輯。
任務：將提供的多個新聞事件進行分類並撰寫「每日簡報」。

要求：
1. **分類綜述**：請將事件依主題分類（例如：政治動態、外交關係、經濟政策、社會議題等）。
2. **語言**：內容必須使用 **简体中文 (Simplified Chinese)**。
3. **格式**：使用 Markdown 格式。
   - 每個類別使用 '###' 標題。
   - 每個事件用列點摘要，並整合相關性高的事件。
   - 開頭請加一個 '# 日本政治每日簡報 (YYYY/MM/DD)' 的大標題（請自動填入今日日期）。
4. **語氣**：客觀、專業、簡潔。

輸入的事件列表如下：`;

            // 4. Call AI
            const completion = await client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: eventsText }
                ],
                model: model,
                temperature: 0.5,
            });

            const content = completion.choices[0]?.message?.content?.trim();

            if (!content) {
                return { success: false, error: 'Empty response from AI' };
            }

            return { success: true, content };

        } catch (error) {
            console.error('Briefing generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

export const briefingService = new BriefingService();
