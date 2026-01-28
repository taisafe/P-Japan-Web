import { db } from '@/lib/db';
import { blacklists } from '@/lib/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type BlacklistRule = typeof blacklists.$inferSelect;

export class BlacklistService {
    /**
     * Add a new blacklist rule.
     */
    async addRule(type: 'source' | 'title' | 'url', value: string, description?: string): Promise<BlacklistRule> {
        const id = uuidv4();
        const newRule = {
            id,
            type,
            value,
            description: description || null,
            createdAt: new Date(),
        };
        await db.insert(blacklists).values(newRule);
        return newRule;
    }

    /**
     * Remove a blacklist rule by ID.
     */
    async removeRule(id: string): Promise<void> {
        await db.delete(blacklists).where(eq(blacklists.id, id));
    }

    /**
     * Get all blacklist rules.
     */
    async getAllRules(): Promise<BlacklistRule[]> {
        return db.select().from(blacklists);
    }

    /**
     * Check if an article is blocked by any rule.
     * @param title - Article title
     * @param url - Article URL
     * @param sourceId - Source ID
     * @returns true if the article should be blocked
     */
    async isBlocked(title: string, url: string, sourceId: string): Promise<boolean> {
        const rules = await this.getAllRules();

        for (const rule of rules) {
            switch (rule.type) {
                case 'source':
                    if (rule.value === sourceId) {
                        return true;
                    }
                    break;
                case 'title':
                    // Case-insensitive partial match for title keywords
                    if (title.toLowerCase().includes(rule.value.toLowerCase())) {
                        return true;
                    }
                    break;
                case 'url':
                    // Partial match for URL patterns
                    if (url.includes(rule.value)) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }
}

export const blacklistService = new BlacklistService();
