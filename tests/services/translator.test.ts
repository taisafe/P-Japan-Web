
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translationService } from '@/lib/services/translator';

const { mockCreate } = vi.hoisted(() => {
    return { mockCreate: vi.fn() }
});

vi.mock('@/lib/services/ai-client', () => ({
    getAIClient: vi.fn().mockResolvedValue({
        client: {
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        },
        model: 'gpt-mock'
    })
}));

describe('TranslationService', () => {
    beforeEach(() => {
        mockCreate.mockReset();
    });

    it('should translate title', async () => {
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: "Translated Title" } }]
        });

        const result = await translationService.translateTitle("Japanese Title");
        expect(result).toBe("Translated Title");
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle translation error gracefully', async () => {
        mockCreate.mockRejectedValue(new Error("AI Error"));
        const result = await translationService.translateTitle("Japanese Title");
        expect(result).toBe("");
    });
});
