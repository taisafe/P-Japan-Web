import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

export async function calculateSimilarity(textA: string, textB: string): Promise<number> {
    if (!textA || !textB) return 0;

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: [textA, textB],
        });

        const embeddings = response.data.map(d => d.embedding);
        if (embeddings.length < 2) return 0;

        return cosineSimilarity(embeddings[0], embeddings[1]);
    } catch (error) {
        console.error("Similarity calculation failed:", error);
        // Fallback or rethrow? For now return 0
        return 0;
    }
}
