import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '@/lib/services/settings';
import OpenAI from 'openai';

interface TranslationResult {
    success: boolean;
    translatedText?: string;
    error?: string;
}

export class TranslationService {
    private async getClient() {
        const settings = await getSettings([
            'ai.translation.provider',
            'ai.translation.api_key',
            'ai.translation.base_url',
            'ai.translation.model'
        ]);

        const apiKey = settings['ai.translation.api_key'];
        const baseURL = settings['ai.translation.base_url'];

        if (!apiKey) {
            throw new Error('Translation API key is not configured');
        }

        return {
            client: new OpenAI({
                apiKey: apiKey,
                baseURL: baseURL || undefined, // undefined lets OpenAI use default
            }),
            model: settings['ai.translation.model'] || 'gpt-3.5-turbo', // Default fallback
            provider: settings['ai.translation.provider']
        };
    }

    async translateArticle(articleId: string): Promise<TranslationResult> {
        try {
            // 1. Get article content
            const article = await db.query.articles.findFirst({
                where: eq(articles.id, articleId),
                columns: {
                    id: true,
                    content: true,
                    contentCN: true,
                    title: true,
                }
            });

            if (!article) {
                return { success: false, error: 'Article not found' };
            }

            // 2. Check if already translated
            if (article.contentCN) {
                return { success: true, translatedText: article.contentCN };
            }

            if (!article.content) {
                return { success: false, error: 'Article has no content to translate' };
            }

            // 3. Initialize LLM Client
            const { client, model } = await this.getClient();

            // 4. Construct Prompt
            const systemPrompt = `你是一個專業的日本政治新聞翻譯專家。
請將提供的日文新聞內容翻譯成繁體中文 (Traditional Chinese)。
重點要求：
1. 保持新聞的客觀語氣。
2. 準確翻譯日本政治專有名詞 (例如：自民党 -> 自民黨, 衆議院 -> 眾議院)。
3. 輸出格式必須是 Markdown，保留原本的段落結構。
4. 這是標題：${article.title || '無標題'}
請直接輸出翻譯後的內容，不要包含任何開場白或結語。`;

            // 5. Call AI
            const completion = await client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: article.content }
                ],
                model: model,
                temperature: 0.3, // Lower temperature for more deterministic translation
            });

            const translatedText = completion.choices[0]?.message?.content?.trim();

            if (!translatedText) {
                return { success: false, error: 'Empty response from AI' };
            }

            // 6. Save to DB
            await db.update(articles)
                .set({ contentCN: translatedText })
                .where(eq(articles.id, articleId));

            return { success: true, translatedText };

        } catch (error) {
            console.error('Translation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown translation error'
            };
        }
    }
}

export const translationService = new TranslationService();
