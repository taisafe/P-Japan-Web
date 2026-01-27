"use client";

import * as React from "react";
import { Download, Upload, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { restoreBackupAction } from "@/app/settings/restore-action";

export function BackupSection() {
    const [isExporting, setIsExporting] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch("/api/backup");
            if (!response.ok) {
                throw new Error("導出失敗");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const dateStr = new Date().toISOString().split("T")[0];
            a.download = `japan-politics-backup-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("備份導出成功", {
                description: "備份文件已下載到您的設備。",
            });
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("備份導出失敗", {
                description: error instanceof Error ? error.message : "未知錯誤",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith(".json")) {
                toast.error("文件格式錯誤", {
                    description: "請選擇 .json 格式的備份文件。",
                });
                return;
            }
            setSelectedFile(file);
            setShowConfirmDialog(true);
        }
        // Reset the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleConfirmImport = async () => {
        if (!selectedFile) return;

        setShowConfirmDialog(false);
        setIsImporting(true);

        try {
            const formData = new FormData();
            formData.append("backupFile", selectedFile);

            const result = await restoreBackupAction(formData);

            if (result.success) {
                toast.success("備份還原成功", {
                    description: "系統已恢復到備份時的狀態，頁面將自動刷新。",
                });
                // Reload the page to reflect the restored data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error("備份還原失敗", {
                    description: result.error || "未知錯誤",
                });
            }
        } catch (error) {
            console.error("Import failed:", error);
            toast.error("備份還原失敗", {
                description: error instanceof Error ? error.message : "未知錯誤",
            });
        } finally {
            setIsImporting(false);
            setSelectedFile(null);
        }
    };

    const handleCancelImport = () => {
        setShowConfirmDialog(false);
        setSelectedFile(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>數據備份與還原</CardTitle>
                    <CardDescription>
                        導出完整的系統備份，或從備份文件中還原數據。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting || isImporting}
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    導出中...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    下載備份
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExporting || isImporting}
                            className="flex-1"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    還原中...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    導入備份
                                </>
                            )}
                        </Button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <p className="text-xs text-muted-foreground">
                        備份包含所有事件、文章、來源、設定和日誌數據。
                    </p>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            確認還原備份？
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                您即將從文件 <strong>{selectedFile?.name}</strong> 還原備份。
                            </p>
                            <p className="text-destructive font-medium">
                                ⚠️ 警告：此操作將清除所有現有數據，並用備份文件中的數據完全替換。此操作無法撤銷！
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelImport}>
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmImport}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            確認還原
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
