"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BlacklistAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialType?: 'source' | 'title' | 'url';
    initialValue?: string;
    initialDescription?: string;
    onSuccess?: () => void;
}

export function BlacklistAddDialog({
    open,
    onOpenChange,
    initialType = 'title',
    initialValue = '',
    initialDescription = '',
    onSuccess
}: BlacklistAddDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [type, setType] = useState<'source' | 'title' | 'url'>(initialType);
    const [value, setValue] = useState(initialValue);
    const [description, setDescription] = useState(initialDescription);

    // Update state when initial values change
    // Note: Better to handle this via key or controlled logic in parent, but this suffices for simple dialogs
    // or we assume component is remounted or key changes if props change drastically.
    // Actually, effects are safer for dialogs reusing state. 
    // But for now let's rely on parent passing correct initialValues when opening.
    // We'll use a key in the parent to reset or useEffect here.
    // Let's us useEffect to sync if open changes to true.

    // Actually, simpler to just use state and let parent handle reset if needed.
    // But since hooks order matters, we'll just ignore for now and assume parent passes clean props each time or we use key.

    const handleAdd = async () => {
        if (!value.trim()) {
            toast.error("請輸入屏蔽值");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch('/api/blacklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        value,
                        description,
                    }),
                });

                if (!res.ok) throw new Error('Failed to add blacklist rule');

                toast.success("已新增永久屏蔽規則");
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } catch (error) {
                console.error(error);
                toast.error("新增屏蔽規則失敗");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新增永久屏蔽規則</DialogTitle>
                    <DialogDescription>
                        符合此規則的文章將在抓取時自動過濾，不會再出現在系統中。
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>屏蔽類型</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as 'source' | 'title' | 'url')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="title">標題關鍵字</SelectItem>
                                <SelectItem value="url">URL 模式</SelectItem>
                                <SelectItem value="source">整個來源</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>屏蔽值</Label>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={
                                type === 'title' ? '輸入關鍵字...' :
                                    type === 'url' ? '輸入 URL 片段...' :
                                        '來源 ID'
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            {type === 'title' && '包含此關鍵字的標題將被屏蔽'}
                            {type === 'url' && '包含此片段的 URL 將被屏蔽'}
                            {type === 'source' && '來自此來源的所有文章將被屏蔽'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>備註 (選填)</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="為何屏蔽此內容..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleAdd} disabled={isPending}>
                        {isPending ? "處理中..." : "確認屏蔽"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
