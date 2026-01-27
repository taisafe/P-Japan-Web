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

export async function extractFromHtml(html: string, url: string): Promise<ExtractedArticle | null> {
    try {
        const dom = new JSDOM(html, { url });
        const doc = dom.window.document;

        // Custom Extractor for Yahoo News Japan
        // Yahoo often puts content in specific containers that Readability might miss if surrounded by heavy navigation
        if (url.includes("news.yahoo.co.jp")) {
            // Remove navigation and rankings BEFORE parsing to help Readability or manual extraction
            const noiseSelectors = [
                '#uamods-ranking', '#uamods-access-ranking',
                '.ranking', '.accessRanking',
                '#uamods-pickup', 'footer', 'header',
                '.sc-gpHhfC' // Often "Related articles" (dynamic class, but worth trying common ones)
            ];
            noiseSelectors.forEach(sel => {
                doc.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Specific selector for article body in Yahoo
            // Yahoo JP usually uses `.article_body` or `.sc-dEfkYy` (high likelihood text container)
            // We will try to grab the content manually if Readability fails, or just trust specific selectors common on Yahoo
            const articleBody = doc.querySelector('.article_body') || doc.querySelector('#uamods-article');
            if (articleBody) {
                // Use this as the "article" context for Readability or just take it?
                // Readability is safer for cleaning, so let's try to isolate it.
                // Or create a new "clean" document with just this body.
                // However, simpler is often better:

                // Let's modify the DOM to ONLY contain the article body and title, then run Readability
                const bodyClone = articleBody.cloneNode(true);
                const title = doc.querySelector('title')?.textContent || '';

                // Clear body and append only the article
                doc.body.innerHTML = '';
                doc.body.appendChild(bodyClone);
            }
        }

        const reader = new Readability(doc);
        const article = reader.parse();

        if (!article) {
            console.warn(`Readability failed to parse HTML from: ${url}`);
            // Fallback: If it's Yahoo and Readability failed, try raw text extraction from common classes
            if (url.includes("news.yahoo.co.jp")) {
                const bodyText = doc.querySelector('.article_body')?.textContent || "";
                if (bodyText.length > 50) {
                    return {
                        title: doc.querySelector('title')?.textContent || '',
                        content: bodyText, // Plain text as fallback content
                        textContent: bodyText,
                        excerpt: bodyText.substring(0, 100),
                        author: null,
                        siteName: "Yahoo!ニュース",
                        publishedTime: null,
                        url: url
                    };
                }
            }
            return null;
        }

        const nhm = new NodeHtmlMarkdown();
        const content = article.content || '';
        const markdown = nhm.translate(content)
            // Remove images: ![](...)
            .replace(/!\[.*?\]\(.*?\)/g, "")
            // Remove linked images: [![...](...)](...)
            .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "")
            // Remove leftover empty links if any (optional, but good for cleanliness)
            .replace(/\[\s*\]\(.*?\)/g, "")
            .trim();

        return {
            title: article.title || '',
            content: markdown,
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
            author: article.byline || null,
            siteName: article.siteName || null,
            publishedTime: null,
            url: url,
        };
    } catch (error) {
        console.error(`Error extracting from HTML for ${url}:`, error);
        return null;
    }
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
        return extractFromHtml(html, url);

    } catch (error) {
        console.error(`Error extracting from URL ${url}:`, error);
        return null;
    }
}
