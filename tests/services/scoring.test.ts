import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateEventHeatScore, getDecayFactor } from '@/lib/services/scoring';

describe('Scoring Service', () => {
    const mockNow = new Date('2026-01-27T12:00:00Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockNow);
    });

    describe('getDecayFactor', () => {
        it('should return 1.0 for current time', () => {
            const factor = getDecayFactor(mockNow);
            expect(factor).toBeCloseTo(1.0, 2);
        });

        it('should return ~0.9 after 24 hours', () => {
            const oneDayAgo = new Date('2026-01-26T12:00:00Z');
            const factor = getDecayFactor(oneDayAgo);
            expect(factor).toBeCloseTo(0.9, 2);
        });

        it('should return ~0.81 after 48 hours', () => {
            const twoDaysAgo = new Date('2026-01-25T12:00:00Z');
            const factor = getDecayFactor(twoDaysAgo);
            expect(factor).toBeCloseTo(0.81, 2);
        });
    });

    describe('calculateEventHeatScore', () => {
        const baseEvent = {
            id: 'event-1',
            title: 'Test Event',
            summary: '',
            heatScore: 0,
            firstSeenAt: mockNow,
            lastUpdatedAt: mockNow,
            status: 'active' as const,
        };

        it('should return 0 for event with no articles', () => {
            const score = calculateEventHeatScore(baseEvent, []);
            expect(score).toBe(0);
        });

        it('should calculate score for single article', () => {
            const articles = [
                {
                    id: 'a1',
                    sourceId: 's1',
                    matchStatus: 'confirmed' as const,
                    publishedAt: mockNow,
                    source: { id: 's1', weight: 1.0 },
                },
            ];
            const score = calculateEventHeatScore(baseEvent, articles);
            expect(score).toBe(10); // 10 * 1.0 * 1.0 (no decay)
        });

        it('should debias: same source counts once', () => {
            const articles = [
                {
                    id: 'a1',
                    sourceId: 's1',
                    matchStatus: 'confirmed' as const,
                    publishedAt: new Date('2026-01-27T10:00:00Z'),
                    source: { id: 's1', weight: 1.0 },
                },
                {
                    id: 'a2',
                    sourceId: 's1', // Same source
                    matchStatus: 'confirmed' as const,
                    publishedAt: new Date('2026-01-27T11:00:00Z'),
                    source: { id: 's1', weight: 1.0 },
                },
            ];
            const score = calculateEventHeatScore(baseEvent, articles);
            expect(score).toBe(10); // Only counts once
        });

        it('should sum scores from different sources', () => {
            const articles = [
                {
                    id: 'a1',
                    sourceId: 's1',
                    matchStatus: 'confirmed' as const,
                    publishedAt: mockNow,
                    source: { id: 's1', weight: 1.0 },
                },
                {
                    id: 'a2',
                    sourceId: 's2',
                    matchStatus: 'confirmed' as const,
                    publishedAt: mockNow,
                    source: { id: 's2', weight: 1.5 },
                },
            ];
            const score = calculateEventHeatScore(baseEvent, articles);
            expect(score).toBe(25); // 10*1.0 + 10*1.5
        });

        it('should apply time decay', () => {
            const oneDayAgo = new Date('2026-01-26T12:00:00Z');
            const oldEvent = { ...baseEvent, lastUpdatedAt: oneDayAgo };
            const articles = [
                {
                    id: 'a1',
                    sourceId: 's1',
                    matchStatus: 'confirmed' as const,
                    publishedAt: oneDayAgo,
                    source: { id: 's1', weight: 1.0 },
                },
            ];
            const score = calculateEventHeatScore(oldEvent, articles);
            expect(score).toBe(9); // 10 * 0.9 = 9
        });

        it('should ignore pending and rejected articles', () => {
            const articles = [
                {
                    id: 'a1',
                    sourceId: 's1',
                    matchStatus: 'confirmed' as const,
                    publishedAt: mockNow,
                    source: { id: 's1', weight: 1.0 },
                },
                {
                    id: 'a2',
                    sourceId: 's2',
                    matchStatus: 'pending' as const,
                    publishedAt: mockNow,
                    source: { id: 's2', weight: 1.0 },
                },
                {
                    id: 'a3',
                    sourceId: 's3',
                    matchStatus: 'rejected' as const,
                    publishedAt: mockNow,
                    source: { id: 's3', weight: 1.0 },
                },
            ];
            const score = calculateEventHeatScore(baseEvent, articles);
            expect(score).toBe(10); // Only confirmed counts
        });
    });
});
