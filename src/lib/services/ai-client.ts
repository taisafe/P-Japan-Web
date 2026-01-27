import { getSettings, getSetting } from '@/lib/services/settings';
import { AIProviderConfig } from '@/lib/constants/settings';
import OpenAI from 'openai';

/**
 * AI 功能類型
 */
export type AIFunctionType = 'translation' | 'briefing' | 'embedding';

/**
 * AI 客戶端配置結果
 */
export interface AIClientConfig {
    client: OpenAI;
    model: string;
    providerName: string;
}

/**
 * 根據功能類型取得對應的 AI 客戶端和配置
 * @param functionType AI 功能類型 (translation, briefing, embedding)
 * @returns AI 客戶端配置
 */
export async function getAIClient(functionType: AIFunctionType): Promise<AIClientConfig> {
    // 1. 取得功能對應的 provider_id
    const providerIdKey = `ai.${functionType}.provider_id` as const;

    const settings = await getSettings([providerIdKey]);
    const providerId = settings[providerIdKey] as string;

    if (!providerId) {
        throw new Error(`請先在設定頁面配置 ${getFunctionDisplayName(functionType)} 的 AI 提供商`);
    }

    // 2. 取得 providers 列表
    const providers = await getSetting<AIProviderConfig[]>('ai.providers');

    if (!providers || providers.length === 0) {
        throw new Error('請先在設定頁面新增 AI 提供商');
    }

    // 3. 查找對應的 provider
    const provider = providers.find(p => p.id === providerId);

    if (!provider) {
        throw new Error(`找不到指定的 AI 提供商，請檢查 ${getFunctionDisplayName(functionType)} 設定`);
    }

    if (!provider.apiKey) {
        throw new Error(`AI 提供商 "${provider.name}" 的 API 金鑰未設定`);
    }

    // 4. 決定模型：提供商預設 > 系統預設
    const model = provider.model || getDefaultModel(functionType);

    // 5. 建立 OpenAI 客戶端
    const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined,
    });

    return {
        client,
        model,
        providerName: provider.name,
    };
}

/**
 * 取得功能的預設模型
 */
function getDefaultModel(functionType: AIFunctionType): string {
    switch (functionType) {
        case 'translation':
            return 'gpt-3.5-turbo';
        case 'briefing':
            return 'gpt-4o';
        case 'embedding':
            return 'text-embedding-3-small';
    }
}

/**
 * 取得功能的顯示名稱
 */
function getFunctionDisplayName(functionType: AIFunctionType): string {
    switch (functionType) {
        case 'translation':
            return '翻譯';
        case 'briefing':
            return '簡報';
        case 'embedding':
            return '向量嵌入';
    }
}
