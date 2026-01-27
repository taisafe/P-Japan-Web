
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { translationService } from '@/lib/services/translator';
import { isNull, or, eq, sql } from 'drizzle-orm';

async function main() {
    console.log("Starting Backfill Translation...");

    // Find articles with missing titleCN
    // Note: Drizzle definition might use camelCase, checking schema. 
    // Schema: titleCN: text('title_cn')

    const targetArticles = await db.select().from(articles).where(
        or(
            isNull(articles.titleCN),
            eq(articles.titleCN, '')
        )
    ).limit(50); // Process batch of 50

    console.log(`Found ${targetArticles.length} articles to translate.`);

    for (const article of targetArticles) {
        console.log(`Translating: ${article.title}`);
        try {
            // Simple timeout race
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
            const translationPromise = translationService.translateTitle(article.title);

            const titleCN = await Promise.race([translationPromise, timeoutPromise]) as string;

            if (titleCN) {
                await db.update(articles)
                    .set({ titleCN })
                    .where(eq(articles.id, article.id));
                console.log(`  -> Saved: ${titleCN}`);
            } else {
                console.log("  -> Empty translation returned.");
            }
        } catch (e: any) {
            console.error(`  -> Failed: ${e.message}`);
        }
    }

    console.log("Backfill complete.");
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
