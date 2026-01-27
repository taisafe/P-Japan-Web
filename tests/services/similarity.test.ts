import { describe, it, expect, vi } from 'vitest';
import { calculateSimilarity } from '@/lib/services/similarity';

// Mock OpenAI
vi.mock('openai', () => {
    return {
        default: class OpenAI {
            embeddings = {
                create: vi.fn().mockResolvedValue({
                    data: [
                        { embedding: [0.1, 0.2, 0.3] },
                        { embedding: [0.1, 0.2, 0.3] }
                    ]
                })
            }
        }
    }
});

describe('Similarity Service', () => {
    it('should be defined', () => {
        expect(calculateSimilarity).toBeDefined();
    });

    it('should return a number between 0 and 1', async () => {
        const score = await calculateSimilarity('Hello', 'Hello');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    });

    // We can add more specific logic tests if we implement cosine similarity manually
    // For now, testing the interface and basic return type
});
