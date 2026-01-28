'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getBriefingCandidatesAction, generateBriefingAction } from '@/app/actions/briefing';
import type { BriefingCandidate } from '@/lib/services/briefing';
import { useGlobalModal } from '@/components/providers/global-modal-provider';


export function BriefingGenerator() {
    const [candidates, setCandidates] = useState<BriefingCandidate[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const modal = useGlobalModal();

    useEffect(() => {
        loadCandidates();
    }, []);

    async function loadCandidates() {
        setLoading(true);
        const res = await getBriefingCandidatesAction();
        if (res.success && res.data) {
            setCandidates(res.data);
            // Default select top 5 by heat score
            const top5 = res.data.slice(0, 5).map(c => c.id);
            setSelectedIds(new Set(top5));
        }
        setLoading(false);
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleGenerate = async () => {
        if (selectedIds.size === 0) return;
        setGenerating(true);
        setResult(null);

        const res = await generateBriefingAction(Array.from(selectedIds));
        if (res.success && res.content) {
            setResult(res.content);
        } else {
            console.error(res.error);
            modal.alert('產生簡報失敗: ' + res.error);
        }
        setGenerating(false);
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Candidates */}
            <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>候選事件 ({candidates.length})</span>
                        <Badge variant="secondary">已選 {selectedIds.size}</Badge>
                    </CardTitle>
                    <CardDescription>
                        請勾選要包含在簡報中的事件（依熱度排序）
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4 pb-4">
                        <div className="space-y-3">
                            {candidates.map((event) => (
                                <div
                                    key={event.id}
                                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedIds.has(event.id) ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent/50'
                                        }`}
                                    onClick={() => toggleSelection(event.id)}
                                >
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(event.id)}
                                            onChange={() => { }} // Handle by parent onClick
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="font-medium leading-none flex justify-between">
                                            <span>{event.title}</span>
                                            {event.heatScore !== null && (
                                                <Badge variant="outline" className="ml-2 shrink-0">
                                                    🔥 {event.heatScore.toFixed(1)}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {event.summary || '無摘要'}
                                        </p>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>文章數: {event.articleCount}</span>
                                            <span>•</span>
                                            <span>更新於: {event.lastUpdatedAt ? new Date(event.lastUpdatedAt).toLocaleString('zh-TW') : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <div className="p-4 border-t bg-muted/20">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={selectedIds.size === 0 || generating}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成簡報中...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                生成每日簡報 (已選 {selectedIds.size} 則)
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Right Column: Result */}
            <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                        <span>生成結果 (簡體中文)</span>
                        {result && (
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                {copied ? '已複製' : '複製內容'}
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    {result ? (
                        <Tabs defaultValue="preview" className="h-full flex flex-col">
                            <div className="px-4 border-b">
                                <TabsList className="w-full justify-start h-9 p-0 bg-transparent">
                                    <TabsTrigger value="preview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent">
                                        預覽
                                    </TabsTrigger>
                                    <TabsTrigger value="raw" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent">
                                        原始文字
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-0">
                                <ScrollArea className="h-full p-4">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{result}</ReactMarkdown>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="raw" className="flex-1 overflow-hidden m-0 p-0">
                                <Textarea
                                    value={result}
                                    readOnly
                                    className="h-full w-full resize-none border-0 rounded-none p-4 font-mono text-sm focus-visible:ring-0"
                                />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 opacity-50" />
                            </div>
                            <h3 className="font-semibold mb-1">尚未生成簡報</h3>
                            <p className="text-sm max-w-xs">
                                請從左側選單選擇今日的重要事件，然後點擊生成的按鈕。
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
