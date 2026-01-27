
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaggingService } from '@/lib/services/tagging';

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

describe('TaggingService', () => {
    let service: TaggingService;

    beforeEach(() => {
        service = new TaggingService();
        mockCreate.mockReset();
    });

    it('should analyze article and return structured data', async () => {
        const mockResponse = {
            titleCN: "測試標題",
            summary: "summary",
            keywords: ["k1"],
            people: ["p1"],
            events: ["e1"]
        };

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: JSON.stringify(mockResponse) } }]
        });

        const result = await service.analyzeArticle('Test Title', 'Test Content');

        expect(result.titleCN).toBe("測試標題");
        expect(result.keywords).toContain("k1");
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle empty AI response smoothly', async () => {
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: null } }]
        });
        const result = await service.analyzeArticle('Title', 'Content');
        expect(result.keywords).toEqual([]);
    });

    it('should handle JSON parse error', async () => {
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: "Invalid JSON" } }]
        });
        const result = await service.analyzeArticle('Title', 'Content');
        expect(result.keywords).toEqual([]);
    });
});
