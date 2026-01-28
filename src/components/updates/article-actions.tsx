"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteArticle } from "@/app/updates/actions";
import { toast } from "sonner";

interface ArticleActionsProps {
    articleId: string;
}

export function ArticleActions({ articleId }: ArticleActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        startTransition(async () => {
            try {
                await deleteArticle(articleId);
                toast.success("已刪除文章");
            } catch (error) {
                console.error(error);
                toast.error("刪除失敗");
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">刪除文章</span>
                </Button>
            </AlertDialogTrigger>
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
    );
}

