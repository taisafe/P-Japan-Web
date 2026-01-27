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

        const article = await extractFromUrl(url);

        if (!article) {
            return NextResponse.json(
                { error: "Failed to extract content (Readability parsed null) or fetch error" },
                { status: 422 }
            );
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
