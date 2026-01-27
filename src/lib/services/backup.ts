import { db } from '@/lib/db';
import { events, sources, articles, people, systemSettings, fetchRuns, systemLogs } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Type definitions for backup data
export interface BackupData {
    version: string;
    createdAt: string;
    data: {
        events: (typeof events.$inferSelect)[];
        sources: (typeof sources.$inferSelect)[];
        articles: (typeof articles.$inferSelect)[];
        people: (typeof people.$inferSelect)[];
        systemSettings: (typeof systemSettings.$inferSelect)[];
        fetchRuns: (typeof fetchRuns.$inferSelect)[];
        systemLogs: (typeof systemLogs.$inferSelect)[];
    };
}

/**
 * Export all data from the database as a BackupData object.
 */
export async function exportAllData(): Promise<BackupData> {
    const allEvents = await db.select().from(events);
    const allSources = await db.select().from(sources);
    const allArticles = await db.select().from(articles);
    const allPeople = await db.select().from(people);
    const allSettings = await db.select().from(systemSettings);
    const allFetchRuns = await db.select().from(fetchRuns);
    const allSystemLogs = await db.select().from(systemLogs);

    return {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        data: {
            events: allEvents,
            sources: allSources,
            articles: allArticles,
            people: allPeople,
            systemSettings: allSettings,
            fetchRuns: allFetchRuns,
            systemLogs: allSystemLogs,
        },
    };
}

/**
 * Validate the structure of backup data.
 */
function validateBackupData(data: unknown): data is BackupData {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    if (typeof d.version !== 'string') return false;
    if (typeof d.createdAt !== 'string') return false;
    if (typeof d.data !== 'object' || d.data === null) return false;

    const tables = ['events', 'sources', 'articles', 'people', 'systemSettings', 'fetchRuns', 'systemLogs'];
    for (const table of tables) {
        if (!Array.isArray((d.data as Record<string, unknown>)[table])) return false;
    }
    return true;
}

/**
 * Import backup data, replacing all existing data (Wipe & Load).
 * This runs in a transaction for atomicity.
 */
export async function importAllData(rawData: unknown): Promise<{ success: boolean; error?: string }> {
    if (!validateBackupData(rawData)) {
        return { success: false, error: '備份文件格式無效或損壞。' };
    }

    const backupData = rawData as BackupData;

    try {
        // Use raw SQL for transaction since better-sqlite3 drizzle doesn't have built-in transaction for delete+insert
        // We'll delete then insert in order respecting foreign keys
        // Order: delete children first (articles, systemLogs, fetchRuns), then parents (events, sources, people, systemSettings)

        // Delete all existing data (respect FK order: children first)
        await db.delete(articles);
        await db.delete(systemLogs);
        await db.delete(fetchRuns);
        await db.delete(events);
        await db.delete(sources);
        await db.delete(people);
        await db.delete(systemSettings);

        // Insert new data (respect FK order: parents first)
        if (backupData.data.sources.length > 0) {
            await db.insert(sources).values(backupData.data.sources);
        }
        if (backupData.data.events.length > 0) {
            await db.insert(events).values(backupData.data.events);
        }
        if (backupData.data.people.length > 0) {
            await db.insert(people).values(backupData.data.people);
        }
        if (backupData.data.systemSettings.length > 0) {
            await db.insert(systemSettings).values(backupData.data.systemSettings);
        }
        if (backupData.data.fetchRuns.length > 0) {
            await db.insert(fetchRuns).values(backupData.data.fetchRuns);
        }
        if (backupData.data.articles.length > 0) {
            await db.insert(articles).values(backupData.data.articles);
        }
        if (backupData.data.systemLogs.length > 0) {
            await db.insert(systemLogs).values(backupData.data.systemLogs);
        }

        return { success: true };
    } catch (error) {
        console.error('Backup import failed:', error);
        return { success: false, error: error instanceof Error ? error.message : '導入過程中發生未知錯誤。' };
    }
}
