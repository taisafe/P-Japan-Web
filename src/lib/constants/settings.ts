/**
 * AI 提供商配置
 * 此檔案不包含任何伺服器端依賴，可在客戶端元件中安全使用
 */

/**
 * AI 提供商配置
 */
export interface AIProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    model?: string;
}

/**
 * AI 功能用途類型
 */
export type AIFunctionType = 'translation' | 'briefing' | 'embedding';

/**
 * 系統設定的預設值
 * 此檔案不包含任何伺服器端依賴，可在客戶端元件中安全使用
 */
export const SETTING_DEFAULTS = {
    // AI 提供商列表 (集中管理)
    'ai.providers': [] as AIProviderConfig[],

    // 翻譯功能 - 指向提供商 ID
    'ai.translation.provider_id': '',
    'ai.translation.model': '',
    'ai.translation.enabled': true,
    'ai.translation.target_lang': 'zh-CN',

    // 簡報功能 - 指向提供商 ID
    'ai.briefing.provider_id': '',
    'ai.briefing.model': '',

    // 向量嵌入功能 - 指向提供商 ID
    'ai.embedding.provider_id': '',
    'ai.embedding.model': '',

    // 內容抓取設定
    'fetch.rss_interval_minutes': 30,
    'fetch.auto_fetch_enabled': false,
    'fetch.max_articles_per_source': 50,

    // 邏輯演算法設定
    'algorithm.similarity_threshold': 0.75,
    'algorithm.keyword_weight': 0.3,
    'algorithm.embedding_weight': 0.7,
    'algorithm.recency_decay_hours': 48,
    'algorithm.source_weight_multiplier': 1.0,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

/**
 * 可寫入的設定值類型（用於表單提交）
 */
export type SettingsValues = {
    [K in SettingKey]: typeof SETTING_DEFAULTS[K] extends readonly AIProviderConfig[]
    ? AIProviderConfig[]
    : typeof SETTING_DEFAULTS[K] extends boolean
    ? boolean
    : typeof SETTING_DEFAULTS[K] extends number
    ? number
    : string;
};
