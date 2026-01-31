"use client";

import { useState, useTransition, useEffect } from "react";
import { Trash2, Ban, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteArticle } from "@/app/updates/actions";
import { toast } from "sonner";
import { BlacklistAddDialog } from "@/components/settings/blacklist-add-dialog";

interface ArticleActionsProps {
    articleId: string;
    articleTitle?: string;
    articleUrl?: string;
    sourceId?: string;
    sourceName?: string;
}

export function ArticleActions({
    articleId,
    articleTitle,
    articleUrl,
    sourceId,
    sourceName
}: ArticleActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
    const [blacklistType, setBlacklistType] = useState<'source' | 'title' | 'url'>('title');
    const [blacklistValue, setBlacklistValue] = useState('');
    const [blacklistDescription, setBlacklistDescription] = useState('');

    const handleDelete = async () => {
        startTransition(async () => {
            try {
                await deleteArticle(articleId);
                toast.success("已刪除文章");
                setShowDeleteDialog(false);
            } catch (error) {
                console.error(error);
                toast.error("刪除失敗");
            }
        });
    };

    const openBlacklistDialog = (type: 'source' | 'title' | 'url') => {
        setBlacklistType(type);
        switch (type) {
            case 'source':
                setBlacklistValue(sourceId || '');
                setBlacklistDescription(sourceName || '');
                break;
            case 'title':
                setBlacklistValue(articleTitle || '');
                setBlacklistDescription(`屏蔽包含此關鍵字的標題`);
                break;
            case 'url':
                setBlacklistValue(articleUrl || '');
                setBlacklistDescription(`屏蔽此 URL 模式`);
                break;
        }
        setShowBlacklistDialog(true);
    };


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                disabled
            >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">更多操作</span>
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">更多操作</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        刪除文章
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openBlacklistDialog('title')}>
                        <Ban className="h-4 w-4 mr-2" />
                        永久屏蔽 (按標題)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openBlacklistDialog('url')}>
                        <Ban className="h-4 w-4 mr-2" />
                        永久屏蔽 (按 URL)
                    </DropdownMenuItem>
                    {sourceId && (
                        <DropdownMenuItem onClick={() => openBlacklistDialog('source')}>
                            <Ban className="h-4 w-4 mr-2" />
                            永久屏蔽 (整個來源)
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除這篇文章嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此動作無法復原。這將會從資料庫中永久移除此文章及其相關的分析資料。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "刪除中..." : "確認刪除"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Blacklist Dialog */}
            {showBlacklistDialog && (
                <BlacklistAddDialog
                    open={showBlacklistDialog}
                    onOpenChange={setShowBlacklistDialog}
                    initialType={blacklistType}
                    initialValue={blacklistValue}
                    initialDescription={blacklistDescription}
                    onSuccess={handleDelete} // Delete article after adding rule
                />
            )}
        </>
    );
}

