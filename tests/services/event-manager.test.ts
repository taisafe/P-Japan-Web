import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processArticle } from '@/lib/services/event-manager';
import { calculateSimilarity } from '@/lib/services/similarity';

// Hoist mockDb so it's available in vi.mock
const { mockDb } = vi.hoisted(() => {
    return {
        mockDb: {
            query: {
                events: {
                    findMany: vi.fn(),
                }
            },
            insert: vi.fn(),
            update: vi.fn(),
        }
    };
});

// Helper for chainable mocks - defined inside or available to test
const createChainable = () => {
    const chain = {
        values: vi.fn(() => chain),
        set: vi.fn(() => chain),
        where: vi.fn(() => chain),
        returning: vi.fn(() => Promise.resolve([{ id: 'new-event-id' }])),
        execute: vi.fn(() => Promise.resolve()),
    };
    return chain;
};

vi.mock('@/lib/db', () => ({
    db: mockDb
}));

vi.mock('@/lib/services/similarity', () => ({
    calculateSimilarity: vi.fn(),
}));

describe('EventManager', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockDb.insert.mockReturnValue(createChainable());
        mockDb.update.mockReturnValue(createChainable());
    });

    const mockArticle: any = {
        id: 'a1',
        title: 'New Policy Announced',
        description: 'Government announces new policy.', // Changed summary to description
        content: 'Full content...',
        publishedAt: new Date(),
        url: 'http://example.com/1',
        sourceId: 'src1',
        heatScore: 1
    };

    it('should create a new event if no active events exist', async () => {
        mockDb.query.events.findMany.mockResolvedValue([]);

        await processArticle(mockArticle);

        expect(mockDb.insert).toHaveBeenCalled();
        expect(mockDb.update).toHaveBeenCalled();
    });

    it('should match and merge if similarity is high (>0.85)', async () => {
        mockDb.query.events.findMany.mockResolvedValue([
            { id: 'e1', title: 'Policy Announced', summary: 'Gov policy.' }
        ]);
        (calculateSimilarity as any).mockResolvedValue(0.9);

        await processArticle(mockArticle);

        expect(mockDb.insert).not.toHaveBeenCalled();
        expect(mockDb.update).toHaveBeenCalled();
    });

    it('should set status to pending if similarity is medium (>0.60)', async () => {
        mockDb.query.events.findMany.mockResolvedValue([
            { id: 'e1', title: 'Policy Discussed', summary: 'Discussion.' }
        ]);
        (calculateSimilarity as any).mockResolvedValue(0.7);

        await processArticle(mockArticle);

        expect(mockDb.insert).not.toHaveBeenCalled();
        expect(mockDb.update).toHaveBeenCalled();
    });
});
