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
import { Plus, Trash2, ExternalLink, RefreshCw, Twitter, Globe, Languages } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface NewsSource {
    id: string;
    name: string;
    url: string;
    type: "jp" | "en" | "twitter";
    category: string;
    weight: number;
}

export default function SourcesPage() {
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sources");
            const data = await res.json();
            setSources(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Sources Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSource = async (id: string) => {
        if (!confirm("Are you sure you want to remove this source?")) return;

        try {
            const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSources(sources.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error("Delete Source Error:", error);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="font-serif text-4xl font-bold tracking-tight italic">情報來源管理</h1>
                    <p className="text-muted-foreground">管理簡報系統的新聞來源與社群帳號名單。</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="icon" onClick={fetchSources} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button asChild className="bg-editorial-pink hover:bg-editorial-pink/90 text-white font-serif italic">
                        <Link href="/sources/new">
                            <Plus className="mr-2 h-5 w-5" />
                            新增情報來源
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-t-4 border-t-editorial-pink shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="font-serif italic text-xl flex items-center justify-between">
                        收錄名單
                        <Badge variant="secondary" className="font-mono">{sources.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[300px] font-bold uppercase tracking-widest text-xs py-4">來源名稱</TableHead>
                                <TableHead className="font-bold uppercase tracking-widest text-xs">類型</TableHead>
                                <TableHead className="font-bold uppercase tracking-widest text-xs">分類標籤</TableHead>
                                <TableHead className="text-right font-bold uppercase tracking-widest text-xs">權重</TableHead>
                                <TableHead className="text-right font-bold uppercase tracking-widest text-xs">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                                        尚未配置任何來源。系統目前無任何輸入信號。
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sources.map((source) => (
                                    <TableRow key={source.id} className="group hover:bg-muted/20 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-serif font-bold text-lg">{source.name}</span>
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
                                            <span className="text-sm font-medium text-muted-foreground italic">{source.category}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono text-xl font-black text-editorial-pink">
                                                {source.weight.toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => deleteSource(source.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">熱度加權算法</h4>
                        <p className="text-sm italic leading-relaxed">
                            權重較高（Authority Weight）的來源會放大其發布文章的原始分數，使其在每日簡報中獲得更高的可見度。
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">翻譯流水線</h4>
                        <p className="text-sm italic leading-relaxed">
                            此處列出的日文來源將自動進入 AI 翻譯流程，以便與英文報導進行交叉比對。
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="pt-6">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">X/Twitter 監控</h4>
                        <p className="text-sm italic leading-relaxed">
                            註冊為情報來源的 Twitter 帳號將會被 headless 節點持續監控，捕捉高互動的政治討論。
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
