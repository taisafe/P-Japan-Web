"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Trash2, Database, Filter, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BlacklistRule {
    id: string;
    type: 'source' | 'title' | 'url';
    value: string;
    description: string | null;
    createdAt: string | Date;
}

export function BlacklistManager() {
    const [rules, setRules] = useState<BlacklistRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/blacklists');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRules(data);
        } catch (error) {
            console.error('Error fetching blacklist rules:', error);
            toast.error("無法載入屏蔽規則");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/blacklists?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setRules(rules.filter(r => r.id !== id));
            toast.success("已刪除屏蔽規則");
        } catch (error) {
            console.error('Error deleting rule:', error);
            toast.error("刪除失敗");
        } finally {
            setDeleteId(null);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'source':
                return <Badge variant="destructive">來源</Badge>;
            case 'title':
                return <Badge variant="secondary">標題</Badge>;
            case 'url':
                return <Badge variant="outline">URL</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    <CardTitle>永久屏蔽規則</CardTitle>
                </div>
                <CardDescription>
                    管理文章抓取時的過濾規則。符合這些規則的內容將不會被收錄。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        載入中...
                    </div>
                ) : rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Filter className="h-12 w-12 mb-4 opacity-50" />
                        <p>尚無屏蔽規則</p>
                        <p className="text-sm">在文章列表中點擊「更多操作」→「永久屏蔽」來新增規則</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">類型</TableHead>
                                <TableHead>屏蔽值</TableHead>
                                <TableHead>備註</TableHead>
                                <TableHead className="w-40">建立時間</TableHead>
                                <TableHead className="w-20">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>{getTypeBadge(rule.type)}</TableCell>
                                    <TableCell className="font-mono text-sm max-w-xs truncate">
                                        {rule.value}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {rule.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rule.createdAt ? format(new Date(rule.createdAt), "PPP", { locale: zhTW }) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeleteId(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除此屏蔽規則嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            刪除後，符合此規則的文章將可能在下次抓取時被收錄。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            確認刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
