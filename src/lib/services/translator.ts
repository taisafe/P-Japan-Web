import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAIClient } from '@/lib/services/ai-client';

interface TranslationResult {
    success: boolean;
    translatedText?: string;
    titleCN?: string;
    error?: string;
}

export class TranslationService {
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
                    titleCN: true,
                }
            });

            if (!article) {
                return { success: false, error: 'Article not found' };
            }

            // 2. Check if already translated
            if (article.contentCN && article.titleCN) {
                return { success: true, translatedText: article.contentCN, titleCN: article.titleCN };
            }

            if (!article.content) {
                return { success: false, error: 'Article has no content to translate' };
            }

            // 3. Initialize LLM Client via new provider system
            const { client, model } = await getAIClient('translation');

            // 4. Construct Prompt
            const systemPrompt = `你是一個專業的日本政治新聞翻譯專家。
請將提供的日文新聞內容翻譯成簡體中文 (Simplified Chinese)。
重點要求：
1. 保持新聞的客觀語氣。
2. 準確翻譯日本政治專有名詞 (例如：自民党 -> 自民党, 衆議院 -> 众议院)。
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

            let translatedText = completion.choices[0]?.message?.content?.trim();

            if (!translatedText) {
                return { success: false, error: 'Empty response from AI' };
            }

            // Try to extract title from the translated content if it starts with a markdown heading
            let extractedTitle: string | null = null;
            const lines = translatedText.split('\n');
            if (lines[0]?.trim().startsWith('#')) {
                // Extract the heading text (removing # and whitespace)
                extractedTitle = lines[0].trim().replace(/^#+\s*/, '').trim();
                // Remove the heading line from the content to avoid duplication
                translatedText = lines.slice(1).join('\n').trim();
            }

            // Determine title translation
            let newTitleCN = article.titleCN;
            if (!newTitleCN) {
                // First, try to use the extracted title from the content
                if (extractedTitle) {
                    newTitleCN = extractedTitle;
                    console.log('Title extracted from content:', extractedTitle);
                } else {
                    // Fallback to separate title translation call
                    try {
                        const translatedTitle = await this.translateTitle(article.title);
                        if (translatedTitle && translatedTitle.trim()) {
                            newTitleCN = translatedTitle;
                        }
                    } catch (err) {
                        console.warn('Title translation failed during article translation:', err);
                    }
                }
            }

            // 6. Save to DB - only include titleCN if we have a valid value
            const updateData: { contentCN: string; titleCN?: string } = {
                contentCN: translatedText,
            };
            if (newTitleCN && newTitleCN.trim()) {
                updateData.titleCN = newTitleCN;
            }

            await db.update(articles)
                .set(updateData)
                .where(eq(articles.id, articleId));

            return { success: true, translatedText, titleCN: newTitleCN || undefined };

        } catch (error) {
            console.error('Translation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown translation error'
            };
        }
    }
    async translateTitle(title: string): Promise<string> {
        try {
            const { client, model } = await getAIClient('translation');

            // Add 30s timeout (increased from 15s to match content translation)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Translation Timeout")), 30000));

            const completionPromise = client.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a professional translator. Translate this Japanese news title to Simplified Chinese. Output ONLY the translated title.' },
                    { role: 'user', content: title }
                ],
                model: model,
                temperature: 0.3,
            });

            const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

            return completion.choices[0]?.message?.content?.trim() || "";
        } catch (error) {
            console.error('Title translation failed:', error);
            return "";
        }
    }
}

export const translationService = new TranslationService();
