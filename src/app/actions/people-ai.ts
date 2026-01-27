"use server";

import { getAIClient } from "@/lib/services/ai-client";
import { WikiSyncService } from "@/lib/services/people";

interface AutofillResult {
    success: boolean;
    data?: {
        name: string;
        nameJa: string;
        nameKana: string;
        nameEn: string;
        role: string;
        party: string;
        description: string;
        imageUrl: string;
        wikipediaId: string;
    };
    error?: string;
}

/**
 * 從維基百科連結或名稱自動填充人物資料
 * @param query 維基百科連結或人物名稱
 */
export async function autofillPersonAction(query: string): Promise<AutofillResult> {
    if (!query.trim()) {
        return { success: false, error: "請輸入維基百科連結或人物名稱" };
    }

    const wikiService = new WikiSyncService();

    try {
        // 1. Determine Wikipedia title
        let wikiTitle: string;
        let isUrl = false;

        // Check if it's a Wikipedia URL
        const wikiUrlMatch = query.match(/(?:ja\.)?wikipedia\.org\/wiki\/([^#?]+)/i);
        if (wikiUrlMatch) {
            wikiTitle = decodeURIComponent(wikiUrlMatch[1].replace(/_/g, " "));
            isUrl = true;
        } else {
            // Search Wikipedia for the query
            const searchResults = await wikiService.searchCandidates(query);
            if (!searchResults || searchResults.length === 0) {
                return { success: false, error: `找不到「${query}」相關的維基百科條目` };
            }
            wikiTitle = searchResults[0].title;
        }

        // 2. Fetch Wikipedia content
        const wikiDetails = await wikiService.fetchDetails(wikiTitle);
        if (!wikiDetails) {
            return { success: false, error: `無法取得「${wikiTitle}」的維基百科資料` };
        }

        const wikiText = wikiDetails.extract || "";
        const imageUrl = wikiDetails.original?.source || "";

        // 3. Use AI to extract structured data
        const aiConfig = await getAIClient("briefing");

        const prompt = `你是一個人物資料提取助手。請從以下維基百科文本中提取政治人物的資料。

維基百科標題: ${wikiTitle}
維基百科內容:
${wikiText.substring(0, 3000)}

請以 JSON 格式返回以下欄位（所有欄位均為字串，如果找不到資訊請留空字串）：
{
    "name": "顯示名稱（繁體中文，如：岸田文雄）",
    "nameJa": "日文漢字名稱（如：岸田 文雄）",
    "nameKana": "假名讀音（平假名，如：きしだ ふみお）",
    "nameEn": "英文名稱（如：Fumio Kishida）",
    "role": "最重要或目前的職位/頭銜（如：內閣總理大臣、參議院議員）",
    "party": "所屬政黨（如：自由民主黨）",
    "description": "簡短描述（約100-150字，使用繁體中文）"
}

只輸出 JSON，不要有其他文字。`;

        const response = await aiConfig.client.chat.completions.create({
            model: aiConfig.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return { success: false, error: "AI 未能提取資料" };
        }

        const extracted = JSON.parse(content);

        return {
            success: true,
            data: {
                name: extracted.name || wikiTitle,
                nameJa: extracted.nameJa || "",
                nameKana: extracted.nameKana || "",
                nameEn: extracted.nameEn || "",
                role: extracted.role || "",
                party: extracted.party || "",
                description: extracted.description || wikiText.substring(0, 200),
                imageUrl: imageUrl,
                wikipediaId: wikiTitle,
            },
        };
    } catch (error) {
        console.error("Autofill person action error:", error);
        const errorMessage = error instanceof Error ? error.message : "未知錯誤";
        return { success: false, error: `自動填充失敗：${errorMessage}` };
    }
}
