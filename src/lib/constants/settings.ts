/**
 * AI 提供商預設配置
 * 此檔案不包含任何伺服器端依賴，可在客戶端元件中安全使用
 */
export const AI_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
    },
    volcengine: {
        name: '火山方舟',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    },
    custom: {
        name: '自訂',
        baseUrl: '',
    },
} as const;

export type AIProvider = keyof typeof AI_PROVIDERS;

/**
 * 系統設定的預設值
 * 此檔案不包含任何伺服器端依賴，可在客戶端元件中安全使用
 */
export const SETTING_DEFAULTS = {
    // 翻譯功能
    'ai.translation.provider': 'openai' as AIProvider,
    'ai.translation.api_key': '',
    'ai.translation.base_url': '',
    'ai.translation.model': '',
    'ai.translation.enabled': true,
    'ai.translation.target_lang': 'zh-CN',

    // 簡報功能
    'ai.briefing.provider': 'openai' as AIProvider,
    'ai.briefing.api_key': '',
    'ai.briefing.base_url': '',
    'ai.briefing.model': '',

    // 向量嵌入功能
    'ai.embedding.provider': 'openai' as AIProvider,
    'ai.embedding.api_key': '',
    'ai.embedding.base_url': '',
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
    [K in SettingKey]: typeof SETTING_DEFAULTS[K] extends AIProvider
    ? AIProvider
    : typeof SETTING_DEFAULTS[K] extends boolean
    ? boolean
    : typeof SETTING_DEFAULTS[K] extends number
    ? number
    : string;
};
