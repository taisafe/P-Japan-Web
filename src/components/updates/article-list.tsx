"use client";

import { useState, useTransition } from "react";
import { ArticleWithRelations, ArticleCard } from "./article-card";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { bulkDeleteArticles } from "@/app/updates/actions";
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

interface ArticleListProps {
    articles: ArticleWithRelations[];
}

export function ArticleList({ articles }: ArticleListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const isSelectionMode = selectedIds.size > 0;

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === articles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(articles.map(a => a.id)));
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        startTransition(async () => {
            try {
                await bulkDeleteArticles(Array.from(selectedIds));
                toast.success(`已刪除 ${selectedIds.size} 篇文章`);
                setSelectedIds(new Set());
                setShowDeleteDialog(false);
            } catch (error) {
                console.error(error);
                toast.error("刪除失敗");
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar for Selection Mode - Optional: Could be placed here or floating */}

            <div className="grid gap-4">
                {articles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        目前沒有最新動態。請前往「情報來源」執行抓取。
                    </div>
                ) : (
                    articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            isSelected={selectedIds.has(article.id)}
                            onToggleSelect={toggleSelect}
                            isSelectionMode={isSelectionMode}
                        />
                    ))
                )}
            </div>

            {/* Floating Action Bar */}
            <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${isSelectionMode ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-background border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 min-w-[320px] justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                            {selectedIds.size}
                        </div>
                        <span className="text-sm font-medium">已選擇</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            className="h-8 text-xs"
                        >
                            {selectedIds.size === articles.length ? "取消全選" : "全選"}
                        </Button>

                        <div className="h-4 w-px bg-border mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearSelection}
                            className="h-8 w-8 hover:bg-muted rounded-full"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">取消</span>
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={isPending}
                            className="h-8 px-3 ml-1 rounded-full text-xs"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            刪除
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除選取的文章嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            您即將刪除 {selectedIds.size} 篇文章。此動作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "刪除中..." : "確認刪除"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
