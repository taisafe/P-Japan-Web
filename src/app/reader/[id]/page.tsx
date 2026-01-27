import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { articles, sources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReaderView } from '@/components/reader/ReaderView';




interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: PageProps) {
    const { id } = await params;

    const article = await db.query.articles.findFirst({
        where: eq(articles.id, id),
        with: {
            source: true
        }
    });

    if (!article) {
        notFound();
    }

    return (
        <div className={`fixed inset-0 z-[100] bg-background overscroll-none`}>
            {/* 
                Explanation: 
                We use 'fixed inset-0 z-[100]' to overlay the entire customized 
                dashboard layout (Sidebar, etc.) without needing to refactor the 
                RootLayout using Route Groups at this stage. 
            */}
            <ReaderView article={{
                ...article,
                publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            }} />
        </div>
    );
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const article = await db.query.articles.findFirst({
        where: eq(articles.id, id),
        columns: { title: true, description: true }
    });

    if (!article) return { title: 'Article Not Found' };

    return {
        title: article.title,
        description: article.description || 'Japan Politics Article',
    };
}
