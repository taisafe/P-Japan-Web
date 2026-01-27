
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { articles, people, articlePeople } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Assuming we are running against a real DB or test DB connected via db module.
// Warning: This might write to local DB if not mocked or using separate test db env.
// For now, we clean up created data.

describe('Database Relationships', () => {
    const articleId = uuidv4();
    const personId = uuidv4();

    beforeEach(async () => {
        // Setup data
        await db.insert(articles).values({
            id: articleId,
            title: 'Test Article',
            url: `http://example.com/${articleId}`,
            sourceId: null // Optional
        });

        await db.insert(people).values({
            id: personId,
            name: 'Test Person'
        });
    });

    afterEach(async () => {
        // Cleanup
        await db.delete(articlePeople).where(eq(articlePeople.articleId, articleId));
        await db.delete(articles).where(eq(articles.id, articleId));
        await db.delete(people).where(eq(people.id, personId));
    });

    it('should link article and person via articlePeople table', async () => {
        await db.insert(articlePeople).values({
            articleId,
            personId
        });

        // Query relation
        const result = await db.query.articlePeople.findFirst({
            where: eq(articlePeople.articleId, articleId),
            with: {
                article: true,
                person: true
            }
        });

        expect(result).toBeDefined();
        expect(result?.article.id).toBe(articleId);
        expect(result?.person.id).toBe(personId);
    });
});
