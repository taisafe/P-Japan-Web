
import { WikiSyncService } from "@/lib/services/people";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const wikiService = new WikiSyncService();

    // First search for the page to get the exact title or let's try to fetch directly if we assume query is title
    // But usually better to search first? 
    // The previous logic was: sync(id) -> fetchDetails.
    // Here we want to support "search and auto-fill".

    // Strategy: Search first, then if 1st result is good confidence, fetch details.
    // Or just return search results? The UI expects detail fill.
    // Let's implementing: Search unique match or exact match.

    // Actually the UI calls it with `nameJa` or `name`.
    console.log(`Searching wiki for: ${query}`);

    const searchResults = await wikiService.searchCandidates(query);
    if (!searchResults || searchResults.length === 0) {
        return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    const firstHit = searchResults[0];
    // Fetch details for the first hit
    const details = await wikiService.fetchDetails(firstHit.title);

    return NextResponse.json(details);
}
