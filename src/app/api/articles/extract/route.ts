import { extractFromUrl } from "@/lib/scraper/extractor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        let article = await extractFromUrl(url);

        // Fallback to Browser if standard fetch fails or yields empty content
        if (!article || !article.content) {
            console.log("Standard extraction failed/empty, attempting Browser Extraction...");
            try {
                // Dynamic import to avoid loading puppeteer if not needed (though it's imported in browser.ts)
                const { extractWithBrowser } = await import("@/lib/scraper/browser");
                const { extractFromHtml } = await import("@/lib/scraper/extractor");

                const html = await extractWithBrowser(url);
                if (html) {
                    article = await extractFromHtml(html, url);
                }
            } catch (browserError) {
                console.error("Browser Extraction Error:", browserError);
            }
        }

        if (!article) {
            return NextResponse.json(
                { error: "Failed to extract content (Readability parsed null) or fetch error" },
                { status: 422 }
            );
        }

        // AI Cleaning Step
        try {
            const { getAIClient } = await import("@/lib/services/ai-client");
            const { client, model } = await getAIClient("translation"); // Reuse translation provider for text processing

            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an expert news editor. Your task is to extract the MAIN article content from the provided Markdown.
Remove ALL of the following:
- Navigation menus
- Article rankings (e.g., 'Access Ranking', 'Most Read')
- Related article links (unless embedded in the main text)
- Advertisements
- Social media share buttons text
- Copyright footers
- 'Read more' links
- Images and image links (already removed, but ensure none remain)

Keep ONLY:
- The main headline
- The main body text

Return the result in clean Markdown format. Do not add any conversational text.`
                    },
                    { role: "user", content: article.content }
                ],
                model: model,
                temperature: 0.1, // Low temp for extraction
            });

            const cleanedContent = completion.choices[0]?.message?.content?.trim();
            if (cleanedContent) {
                article.content = cleanedContent;
            }
        } catch (aiError) {
            console.error("AI Cleaning Failed:", aiError);
            // Fallback to original content (which was already regex-cleaned in extractor.ts)
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error("API Extract Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
