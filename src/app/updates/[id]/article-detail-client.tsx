'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Sparkles, UserPlus, FileText, Globe, ArrowLeft } from "lucide-react";
import { analyzeAndTagArticle, translateContent } from "@/app/updates/actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define simpler type interface for client props to avoid passing Dates/complex objects if not needed,
// but for simplicity we assume passed props are serializable.
interface ArticleDetailProps {
    article: any; // Using any for simplicity in this artifact, ideally shared type
}

export function ArticleDetailClient({ article }: ArticleDetailProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const router = useRouter();

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const toastId = toast.loading("AI 正在分析與標記...");
        try {
            await analyzeAndTagArticle(article.id);
            toast.success("分析完成", { id: toastId });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("分析失敗", { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTranslate = async () => {
        setIsTranslating(true);
        const toastId = toast.loading("AI 正在翻譯全文...");
        try {
            await translateContent(article.id);
            toast.success("翻譯完成", { id: toastId });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("翻譯失敗", { id: toastId });
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header / Toolbar */}
            <div className="border-b bg-background p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/updates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-0.5">
                        <h1 className="text-lg font-bold leading-none truncate max-w-[600px]">{article.titleCN || article.title}</h1>
                        {article.titleCN && <p className="text-xs text-muted-foreground truncate max-w-[600px]">{article.title}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!article.contentCN && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                            <Globe className={`mr-2 h-3.5 w-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                            翻譯全文
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="border-editorial-pink/50 text-editorial-pink hover:bg-editorial-pink/10"
                    >
                        <Sparkles className={`mr-2 h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        AI 分析標記
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Tag className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>文章標記與關聯</SheetTitle>
                            </SheetHeader>
                            <div className="py-6 space-y-6">
                                {/* Tags Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Tag className="h-4 w-4" /> 標籤 (Tags)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {article.tags && Array.isArray(article.tags) ? article.tags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        )) : <span className="text-sm text-muted-foreground">無標籤</span>}
                                    </div>
                                </div>
                                <Separator />
                                {/* People Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" /> 關聯人物
                                    </h3>
                                    <div className="space-y-2">
                                        {article.articlePeople?.map((ap: any) => (
                                            <div key={ap.person.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded text-sm">
                                                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                                    {ap.person.name.substring(0, 1)}
                                                </div>
                                                <span>{ap.person.name}</span>
                                            </div>
                                        ))}
                                        {(!article.articlePeople || article.articlePeople.length === 0) && (
                                            <span className="text-sm text-muted-foreground">無關聯人物</span>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                {/* Event Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> 歸屬事件
                                    </h3>
                                    {article.event ? (
                                        <div className="bg-muted/50 p-2 rounded text-sm font-medium">
                                            {article.event.title}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">尚未歸檔至事件</span>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Split View Content */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-2 divide-x divide-border">
                {/* Left: Original */}
                <ScrollArea className="h-full">
                    <div className="p-6 md:p-8 max-w-prose mx-auto">
                        <div className="mb-6 pb-4 border-b">
                            <h2 className="text-2xl font-serif font-bold mb-2">{article.title}</h2>
                            <div className="text-sm text-muted-foreground flex gap-4">
                                <span>Source: {article.source?.name}</span>
                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <article className="prose dark:prose-invert prose-stone max-w-none text-base leading-relaxed whitespace-pre-wrap font-serif">
                            {article.content || "無內容"}
                        </article>
                    </div>
                </ScrollArea>

                {/* Right: Translated */}
                <ScrollArea className="h-full bg-muted/10">
                    <div className="p-6 md:p-8 max-w-prose mx-auto">
                        <div className="mb-6 pb-4 border-b">
                            <h2 className="text-2xl font-bold mb-2 tracking-tight">{article.titleCN || "等待翻譯..."}</h2>
                            <Badge variant="outline" className="text-xs">繁體中文 (AI 翻譯)</Badge>
                        </div>

                        {article.contentCN ? (
                            <article className="prose dark:prose-invert prose-stone max-w-none text-base leading-relaxed whitespace-pre-wrap">
                                {article.contentCN}
                            </article>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                <Globe className="h-12 w-12 opacity-20" />
                                <p>尚未翻譯內容</p>
                                <Button onClick={handleTranslate} disabled={isTranslating}>
                                    {isTranslating ? "翻譯中..." : "立即翻譯"}
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
