import { getAIClient } from './ai-client';
import { db } from '@/lib/db';
import { people } from '@/lib/db/schema';
import { like, or } from 'drizzle-orm';

export interface TaggingResult {
    summary: string;
    keywords: string[];
    people: string[]; // Names of people found
    events: string[]; // Potential event topics
    titleCN?: string;
}

export class TaggingService {

    async analyzeArticle(title: string, content: string, titleJa?: string): Promise<TaggingResult> {
        const { client, model } = await getAIClient('briefing'); // Use briefing config for analysis (usually stronger model)

        const prompt = `
        You are a political analyst for Japanese politics.
        Analyze the following article content and extracted metadata.
        
        Title: ${title}
        ${titleJa ? `Title (JA): ${titleJa}` : ''}
        Content: ${content.substring(0, 3000)}... (truncated)

        Task:
        1.  Translate the title to Traditional Chinese (Taiwan usage).
        2.  Summarize the article in Traditional Chinese (max 100 chars).
        3.  Extract key entity names (Politicians) present in the text (Japanese or English names).
        4.  Extract 3-5 generic keywords (e.g., Election, Scandal, Policy).
        5.  Identify the main event topic if applicable.

        Output JSON format:
        {
            "titleCN": "...",
            "summary": "...",
            "keywords": ["tag1", "tag2"],
            "people": ["Name1", "Name2"],
            "events": ["Event Name"]
        }
        `;

        try {
            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const contentStr = response.choices[0].message.content;
            if (!contentStr) throw new Error("No response content");

            const result = JSON.parse(contentStr);
            return {
                titleCN: result.titleCN,
                summary: result.summary,
                keywords: result.keywords || [],
                people: result.people || [],
                events: result.events || []
            };
        } catch (error) {
            console.error("Tagging analysis failed:", error);
            return {
                summary: "",
                keywords: [],
                people: [],
                events: []
            };
        }
    }

    // Helper to find people IDs in DB based on names
    async matchPeople(names: string[]): Promise<{ id: string, name: string }[]> {
        if (names.length === 0) return [];

        // This is a naive implementation. Ideally would use vector search or exact match variants.
        // For now, checks name, name_ja, name_en
        const matched: { id: string, name: string }[] = [];

        for (const name of names) {
            const person = await db.query.people.findFirst({
                where: or(
                    like(people.name, name),
                    like(people.nameJa, name),
                    like(people.nameEn, name)
                ),
                columns: { id: true, name: true }
            });
            if (person) {
                matched.push(person);
            }
        }
        return matched;
    }
}
