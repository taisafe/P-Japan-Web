'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Languages, Type, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ArticleData {
    id: string;
    title: string;
    content: string | null;
    contentCN: string | null;
    titleCN: string | null;
    publishedAt: string | null;
    source: {
        name: string;
    } | null;
}

interface ReaderViewProps {
    article: ArticleData;
}

export function ReaderView({ article }: ReaderViewProps) {
    const router = useRouter();
    const [translatedText, setTranslatedText] = React.useState<string | null>(article.contentCN);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSerif, setIsSerif] = React.useState(true);
    const [fontSize, setFontSize] = React.useState<'sm' | 'base' | 'lg'>('base');

    // For mobile
    const [activeTab, setActiveTab] = React.useState<string>(article.contentCN ? 'translated' : 'original');

    // Derived title logic: show translated title if available AND translation is shown or active
    // But typically we want to show the translated title prominently if it exists.
    // Let's toggle it based on the view state or just show translated title if available?
    // User asked "Title not translated".
    // Let's show translated title as main ID if we are in "translated" mode or if we have it?
    // Actually, usually we want to see the title in the language we are reading.

    // Simple logic: If we have translated text (meaning we are capable of showing translation), use translated title if available.
    const displayTitle = (translatedText || activeTab === 'translated') && article.titleCN ? article.titleCN : article.title;

    const handleTranslate = async () => {
        if (translatedText) return;

        setIsLoading(true);
        // Switch to translated tab immediately on mobile to show loading state
        if (window.innerWidth < 768) {
            setActiveTab('translated');
        }

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId: article.id }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setTranslatedText(data.translatedText);
                // We might need to refresh to get the titleCN if it was updated in DB, 
                // but for now the API returns translatedText. 
                // Ideally the API should return the whole updated article or we assume title was translated too if we triggered it.
                // The current /api/translate might need to return titleCN too.
                // Let's checking /api/translate implementation next.
                if (data.titleCN) {
                    // We need a way to update title in UI without full refresh if we want it instant.
                    // But for now, let's just rely on refresh or initial load.
                    // Actually, we can add local state for title if needed, but let's stick to props for simplicity first, 
                    // users mostly care about viewing already translated stuff.
                    router.refresh();
                }
            } else {
                console.error('Translation failed:', data.error);
                // TODO: Show toast error
            }
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFont = () => setIsSerif(!isSerif);
    const cycleFontSize = () => {
        setFontSize(prev => {
            if (prev === 'sm') return 'base';
            if (prev === 'base') return 'lg';
            return 'sm';
        });
    };

    const fontSizeClass = {
        sm: 'text-base leading-relaxed',
        base: 'text-lg leading-relaxed',
        lg: 'text-xl leading-loose'
    }[fontSize];

    const fontFamilyClass = isSerif ? 'font-serif' : 'font-sans';

    // Helper to render content with paragraphs
    const renderContent = (text: string | null, isLoadingState = false) => {
        if (isLoadingState) {
            return (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <div className="h-8" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            );
        }

        if (!text) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground p-8 text-center bg-muted/30 rounded-lg m-4 border-2 border-dashed">
                    <Languages className="w-12 h-12 mb-4 opacity-20" />
                    <p className="mb-4 text-sm">尚未翻譯此文章</p>
                    <Button onClick={handleTranslate} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                        立即翻譯
                    </Button>
                </div>
            );
        }

        return (
            <div className={cn("prose dark:prose-invert max-w-none p-6 whitespace-pre-wrap text-foreground/90", fontSizeClass, fontFamilyClass)}>
                {text}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className={cn(
                "flex-none h-16 border-b flex items-center px-4 justify-between bg-background/95 backdrop-blur z-50 sticky top-0 transition-all duration-300",
                // "transform translate-y-0" // Can add scroll hide logic here
            )}>
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-sm font-semibold truncate" title={displayTitle}>{displayTitle}</h1>
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                            {article.source?.name} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Unknown Date'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Translate Trigger for Desktop */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden md:flex"
                        onClick={handleTranslate}
                        disabled={!!translatedText || isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                        <span className="ml-2">{translatedText ? '已翻譯' : '翻譯'}</span>
                    </Button>

                    <Separator orientation="vertical" className="h-6 hidden md:block" />

                    <Button variant="ghost" size="icon" onClick={toggleFont} title="切換字體">
                        <Type className={cn("h-4 w-4", isSerif && "font-serif")} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={cycleFontSize} title="調整大小">
                        <span className="text-xs font-bold">A</span>
                        <span className="text-lg font-bold">A</span>
                    </Button>
                </div>
            </header>

            {/* Content - Mobile Tabs */}
            <div className="md:hidden flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-4 border-b bg-muted/20">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="translated">譯文</TabsTrigger>
                            <TabsTrigger value="original">原文</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="translated" className="flex-1 mt-0">
                        <ScrollArea className="h-full">
                            {renderContent(translatedText, isLoading)}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="original" className="flex-1 mt-0">
                        <ScrollArea className="h-full">
                            {renderContent(article.content)}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Content - Desktop Split View */}
            <div className="hidden md:flex flex-1 overflow-hidden">
                {/* Left: Original (or Left: Translation if desired, but typically Original Left) */}
                {/* Design check: Usually Original Left, Translation Right for comparison? Or Translation Main? */}
                {/* Let's put Original on Left, Translation on Right. */}

                <div className="flex-1 border-r min-w-0 flex flex-col">
                    <div className="p-3 bg-muted/10 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider flex justify-between">
                        <span>Original Text</span>
                        <Badge variant="outline" className="text-[10px]">{article.source?.name}</Badge>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className={cn("prose dark:prose-invert max-w-none p-8 whitespace-pre-wrap text-muted-foreground/80", fontSizeClass)}>
                            {article.content}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex-1 min-w-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="p-3 bg-muted/10 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                        <span>Translation (簡體中文)</span>
                    </div>
                    <ScrollArea className="flex-1">
                        {renderContent(translatedText, isLoading)}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
