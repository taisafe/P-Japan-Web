import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { desc, gt, inArray } from 'drizzle-orm';
import { getAIClient } from '@/lib/services/ai-client';

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

            // 2. Prepare AI Client via new provider system
            const { client, model } = await getAIClient('briefing');

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
