import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';

/**
 * 系統設定的預設值
 */
export const SETTING_DEFAULTS = {
    // AI 與翻譯設定
    'ai.openai_api_key': '',
    'ai.openai_model': '',
    'ai.translation_enabled': true,
    'ai.translation_target_lang': 'zh-CN',

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
 * 取得單一設定值
 * @param key 設定鍵值
 * @returns 設定值，如果不存在則返回預設值
 */
export async function getSetting<T>(key: SettingKey): Promise<T> {
    try {
        const result = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1);

        if (result.length === 0) {
            return SETTING_DEFAULTS[key] as T;
        }

        const parsed = JSON.parse(result[0].value);
        return parsed as T;
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
        return SETTING_DEFAULTS[key] as T;
    }
}

/**
 * 取得多個設定值
 * @param keys 設定鍵值陣列
 * @returns 設定值物件
 */
export async function getSettings<K extends SettingKey>(
    keys: K[]
): Promise<Record<K, typeof SETTING_DEFAULTS[K]>> {
    try {
        const results = await db
            .select()
            .from(systemSettings);

        const settingsMap = new Map(
            results.map((r) => [r.key, JSON.parse(r.value)])
        );

        const output = {} as Record<K, typeof SETTING_DEFAULTS[K]>;
        for (const key of keys) {
            output[key] = settingsMap.has(key)
                ? settingsMap.get(key)
                : SETTING_DEFAULTS[key];
        }
        return output;
    } catch (error) {
        console.error('Error getting settings:', error);
        const output = {} as Record<K, typeof SETTING_DEFAULTS[K]>;
        for (const key of keys) {
            output[key] = SETTING_DEFAULTS[key];
        }
        return output;
    }
}

/**
 * 取得所有設定值
 * @returns 所有設定值物件
 */
export async function getAllSettings(): Promise<typeof SETTING_DEFAULTS> {
    try {
        const results = await db.select().from(systemSettings);

        const settingsMap = new Map(
            results.map((r) => [r.key, JSON.parse(r.value)])
        );

        const output = { ...SETTING_DEFAULTS };
        for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
            if (settingsMap.has(key)) {
                (output as Record<string, unknown>)[key] = settingsMap.get(key);
            }
        }
        return output;
    } catch (error) {
        console.error('Error getting all settings:', error);
        return { ...SETTING_DEFAULTS };
    }
}

/**
 * 更新單一設定值
 * @param key 設定鍵值
 * @param value 新的設定值
 */
export async function updateSetting(key: SettingKey, value: unknown): Promise<void> {
    try {
        const jsonValue = JSON.stringify(value);

        await db
            .insert(systemSettings)
            .values({
                key,
                value: jsonValue,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: systemSettings.key,
                set: {
                    value: jsonValue,
                    updatedAt: new Date(),
                },
            });
    } catch (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    }
}

/**
 * 批量更新設定值
 * @param settings 設定鍵值對物件
 */
export async function updateSettings(
    settings: Partial<typeof SETTING_DEFAULTS>
): Promise<void> {
    try {
        for (const [key, value] of Object.entries(settings)) {
            await updateSetting(key as SettingKey, value);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}
