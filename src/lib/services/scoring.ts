/**
 * Scoring Service - M6
 * Calculates Heat Scores for Events using Weighted Accumulation with Debias
 */

interface ArticleWithSource {
    id: string;
    sourceId: string | null;
    matchStatus: 'confirmed' | 'pending' | 'rejected' | null;
    publishedAt: Date | null;
    source: { id: string; weight: number | null } | null;
}

interface Event {
    id: string;
    lastUpdatedAt: Date | null;
}

const BASE_POINTS = 10;
const DECAY_RATE = 0.9; // 10% decay
const DECAY_PERIOD_HOURS = 24;

/**
 * Calculate the time decay factor based on how old the event is.
 * Formula: 0.9 ^ (hours since last update / 24)
 * @param lastUpdatedAt - The last update timestamp of the event
 * @returns Decay factor between 0 and 1
 */
export function getDecayFactor(lastUpdatedAt: Date | null): number {
    if (!lastUpdatedAt) return 1.0;

    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate <= 0) return 1.0;

    const decayExponent = hoursSinceUpdate / DECAY_PERIOD_HOURS;
    return Math.pow(DECAY_RATE, decayExponent);
}

/**
 * Calculate the Heat Score for an event.
 * 
 * Algorithm:
 * 1. Filter for confirmed articles only
 * 2. Debias: Group by source, take only one article per source (most recent)
 * 3. Sum: BASE_POINTS * source.weight for each unique source
 * 4. Apply time decay based on event.lastUpdatedAt
 * 
 * @param event - The event to calculate score for
 * @param articlesWithSources - Articles with their source data
 * @returns The calculated heat score (rounded to nearest integer)
 */
export function calculateEventHeatScore(
    event: Event,
    articlesWithSources: ArticleWithSource[]
): number {
    // Step 1: Filter confirmed articles
    const confirmedArticles = articlesWithSources.filter(
        (a) => a.matchStatus === 'confirmed'
    );

    if (confirmedArticles.length === 0) return 0;

    // Step 2: Debias - Group by source, keep most recent per source
    const sourceMap = new Map<string, ArticleWithSource>();

    for (const article of confirmedArticles) {
        if (!article.sourceId || !article.source) continue;

        const existing = sourceMap.get(article.sourceId);
        if (!existing) {
            sourceMap.set(article.sourceId, article);
        } else {
            // Keep the more recent one
            const existingTime = existing.publishedAt?.getTime() ?? 0;
            const currentTime = article.publishedAt?.getTime() ?? 0;
            if (currentTime > existingTime) {
                sourceMap.set(article.sourceId, article);
            }
        }
    }

    // Step 3: Sum weighted points
    let rawScore = 0;
    for (const article of sourceMap.values()) {
        const weight = article.source?.weight ?? 1.0;
        rawScore += BASE_POINTS * weight;
    }

    // Step 4: Apply decay
    const decayFactor = getDecayFactor(event.lastUpdatedAt);
    const finalScore = rawScore * decayFactor;

    return Math.round(finalScore);
}

/**
 * Get a breakdown of the score calculation for UI display.
 */
export function getScoreBreakdown(
    event: Event,
    articlesWithSources: ArticleWithSource[]
): {
    rawScore: number;
    decayFactor: number;
    finalScore: number;
    sourceCount: number;
    sources: Array<{ name?: string; weight: number; points: number }>;
} {
    const confirmedArticles = articlesWithSources.filter(
        (a) => a.matchStatus === 'confirmed'
    );

    const sourceMap = new Map<string, ArticleWithSource>();
    for (const article of confirmedArticles) {
        if (!article.sourceId || !article.source) continue;
        const existing = sourceMap.get(article.sourceId);
        if (!existing || (article.publishedAt?.getTime() ?? 0) > (existing.publishedAt?.getTime() ?? 0)) {
            sourceMap.set(article.sourceId, article);
        }
    }

    const sources: Array<{ name?: string; weight: number; points: number }> = [];
    let rawScore = 0;

    for (const article of sourceMap.values()) {
        const weight = article.source?.weight ?? 1.0;
        const points = BASE_POINTS * weight;
        rawScore += points;
        sources.push({ weight, points });
    }

    const decayFactor = getDecayFactor(event.lastUpdatedAt);
    const finalScore = Math.round(rawScore * decayFactor);

    return {
        rawScore,
        decayFactor: Math.round(decayFactor * 100) / 100,
        finalScore,
        sourceCount: sourceMap.size,
        sources,
    };
}
