"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditSourceDialog } from "@/components/sources/edit-source-dialog";
import { Plus, Trash2, ExternalLink, RefreshCw, Twitter, Globe, Languages, Check, X, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useGlobalModal } from "@/components/providers/global-modal-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewsSource {
    id: string;
    name: string;
    url: string;
    type: "jp" | "en" | "twitter";
    category: string;
    weight: number;
    lastFetchedAt?: string | Date;
}

interface CandidateArticle {
    id: string;
    title: string;
    titleCN: string | null;
    url: string;
    sourceId: string;
    sourceName: string;
    sourceType: string;
    createdAt: string | Date | null;
}

export default function SourcesPage() {
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [candidates, setCandidates] = useState<CandidateArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
    const modal = useGlobalModal();

    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sources");
            const data = await res.json();
            setSources(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Sources Error:", error);
            toast.error("無法載入來源列表");
        } finally {
            setLoading(false);
        }
    };

    const handleManualFetch = async () => {
        setIsFetching(true);
        const toastId = toast.loading("正在抓取候選新聞...", { description: "使用瀏覽器模式，這可能需要較長時間" });

        try {
            const res = await fetch("/api/manual-update", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                toast.success("抓取完成", {
                    id: toastId,
                    description: `新增 ${data.newCandidates || 0} 條候選新聞`
                });
                fetchSources();
                fetchCandidates();
            } else {
                toast.error("抓取失敗", {
                    id: toastId,
                    description: data.error || "未知錯誤"
                });
            }
        } catch (error) {
            console.error("Manual Fetch Error:", error);
            toast.error("請求發生錯誤", { id: toastId });
        } finally {
            setIsFetching(false);
        }
    };

    const fetchCandidates = async () => {
        try {
            const res = await fetch("/api/articles/candidates");
            const data = await res.json();
            setCandidates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Candidates Error:", error);
        }
    };

    const handleApprove = async (articleId: string) => {
        setApprovingIds(prev => new Set(prev).add(articleId));
        const toastId = toast.loading("正在入選並翻譯...");

        try {
            const res = await fetch("/api/articles/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("已加入最新動態", { id: toastId });
                setCandidates(prev => prev.filter(c => c.id !== articleId));
            } else {
                toast.error("操作失敗", { id: toastId, description: data.error });
            }
        } catch (error) {
            console.error("Approve Error:", error);
            toast.error("請求發生錯誤", { id: toastId });
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
        }
    };

    const handleReject = async (articleId: string) => {
        try {
            const res = await fetch("/api/articles/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId }),
            });

            if (res.ok) {
                toast.success("已排除");
                setCandidates(prev => prev.filter(c => c.id !== articleId));
            } else {
                toast.error("操作失敗");
            }
        } catch (error) {
            console.error("Reject Error:", error);
            toast.error("請求發生錯誤");
        }
    };

    const deleteSource = async (id: string) => {
        const confirmed = await modal.confirm("確定要刪除這個來源嗎？");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSources(sources.filter(s => s.id !== id));
                toast.success("來源已刪除");
            } else {
                const data = await res.json();
                toast.error("刪除失敗", { description: data.error || "未知錯誤" });
            }
        } catch (error) {
            console.error("Delete Source Error:", error);
            toast.error("請求發生錯誤");
        }
    };

    useEffect(() => {
        fetchSources();
        fetchCandidates();
    }, []);

    const formatDate = (date: string | Date | undefined) => {
        if (!date) return "-";
        try {
            return format(new Date(date), "MM/dd HH:mm", { locale: zhTW });
        } catch (e) {
            return "-";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-foreground">情報來源管理</h1>
                    <p className="text-muted-foreground">管理簡報系統的新聞來源與社群帳號名單。</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleManualFetch}
                        disabled={isFetching || loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        {isFetching ? '抓取中...' : '抓取候選新聞'}
                    </Button>
                    <Button asChild className="bg-editorial-pink hover:bg-editorial-pink/90 text-white font-medium gap-2">
                        <Link href="/sources/new">
                            <Plus className="h-4 w-4" />
                            新增來源
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="candidates" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="candidates" className="text-lg gap-2">
                        待審核新聞
                        {candidates.length > 0 && (
                            <Badge variant="destructive" className="ml-2">{candidates.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sources" className="text-lg gap-2">
                        收錄來源
                        <Badge variant="secondary" className="ml-2">{sources.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="candidates">
                    <Card className="border-t-4 border-t-amber-500 shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl font-semibold flex items-center justify-between">
                                候選新聞審核
                                <span className="text-sm font-normal text-muted-foreground">
                                    點擊「入選」將抓取全文並翻譯
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[400px] font-bold text-xs py-4 text-muted-foreground">標題</TableHead>
                                        <TableHead className="font-bold text-xs text-muted-foreground">來源</TableHead>
                                        <TableHead className="text-right font-bold text-xs text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {candidates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                                沒有待審核的新聞。點擊「立即抓取新聞」來獲取候選列表。
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        candidates.map((article) => (
                                            <TableRow key={article.id} className="group hover:bg-muted/20 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-lg text-foreground">
                                                            {article.titleCN || article.title}
                                                        </span>
                                                        {article.titleCN && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {article.title}
                                                            </span>
                                                        )}
                                                        <a
                                                            href={article.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-muted-foreground font-mono truncate max-w-[350px] hover:text-editorial-pink flex items-center gap-1"
                                                        >
                                                            {article.url} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="w-fit">
                                                        {article.sourceName}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                                                            onClick={() => handleApprove(article.id)}
                                                            disabled={approvingIds.has(article.id)}
                                                        >
                                                            {approvingIds.has(article.id) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="h-4 w-4" />
                                                            )}
                                                            入選
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleReject(article.id)}
                                                            disabled={approvingIds.has(article.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                            剔除
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sources">
                    <Card className="border-t-4 border-t-editorial-pink shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl font-semibold flex items-center justify-between">
                                收錄名單
                                <Badge variant="secondary" className="font-mono">{sources.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[300px] font-bold text-xs py-4 text-muted-foreground">來源名稱</TableHead>
                                        <TableHead className="font-bold text-xs text-muted-foreground">類型</TableHead>
                                        <TableHead className="font-bold text-xs text-muted-foreground">分類標籤</TableHead>
                                        <TableHead className="text-right font-bold text-xs text-muted-foreground">上次抓取</TableHead>
                                        <TableHead className="text-right font-bold text-xs text-muted-foreground">權重</TableHead>
                                        <TableHead className="text-right font-bold text-xs text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sources.length === 0 && !loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                尚未配置任何來源。系統目前無任何輸入信號。
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sources.map((source) => (
                                            <TableRow key={source.id} className="group hover:bg-muted/20 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-foreground">{source.name}</span>
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-muted-foreground font-mono truncate max-w-[250px] hover:text-editorial-pink flex items-center gap-1"
                                                        >
                                                            {source.url} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize flex w-fit items-center gap-1.5 ${source.type === 'twitter' ? 'border-sky-500/50 text-sky-600 bg-sky-50 dark:bg-sky-950/20' :
                                                        source.type === 'jp' ? 'border-rose-500/50 text-rose-600 bg-rose-50 dark:bg-rose-950/20' :
                                                            'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                                                        }`}>
                                                        {source.type === 'twitter' && <Twitter className="h-3 w-3" />}
                                                        {source.type === 'jp' && <Languages className="h-3 w-3" />}
                                                        {source.type === 'en' && <Globe className="h-3 w-3" />}
                                                        {source.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-muted-foreground">{source.category}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-xs font-mono text-muted-foreground">
                                                        {formatDate(source.lastFetchedAt)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-mono text-xl font-black text-editorial-pink">
                                                        {source.weight.toFixed(1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary transition-colors"
                                                            onClick={() => setEditingSource(source)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                            onClick={() => deleteSource(source.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <EditSourceDialog
                open={!!editingSource}
                onOpenChange={(open) => !open && setEditingSource(null)}
                source={editingSource}
                onSuccess={fetchSources}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs text-muted-foreground mb-2">熱度加權算法</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            權重較高（Authority Weight）的來源會放大其發布文章的原始分數，使其在每日簡報中獲得更高的可見度。
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs text-muted-foreground mb-2">翻譯流水線</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            此處列出的日文來源將自動進入 AI 翻譯流程，以便與英文報導進行交叉比對。
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs text-muted-foreground mb-2">X/Twitter 監控</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            註冊為情報來源的 Twitter 帳號將會被 headless 節點持續監控，捕捉高互動的政治討論。
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
