import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { NodeHtmlMarkdown } from 'node-html-markdown';

export interface ExtractedArticle {
    title: string;
    content: string; // Markdown
    textContent: string; // Plain text
    excerpt: string;
    author: string | null;
    siteName: string | null;
    publishedTime: string | null;
    url: string;
}

export async function extractFromUrl(url: string): Promise<ExtractedArticle | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch URL: ${url} (Status: ${response.status})`);
            return null;
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            console.warn(`Readability failed to parse: ${url}`);
            return null;
        }

        const nhm = new NodeHtmlMarkdown();
        const content = article.content || '';
        const markdown = nhm.translate(content);

        return {
            title: article.title || '',
            content: markdown,
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
            author: article.byline || null,
            siteName: article.siteName || null,
            publishedTime: null, // Readability doesn't reliably return publishedTime in all versions, handled by caller or other metadata parsers if needed
            url: url,
        };
    } catch (error) {
        console.error(`Error extracting from URL ${url}:`, error);
        return null;
    }
}
