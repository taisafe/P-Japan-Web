"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AIProviderConfig } from "@/lib/constants/settings";

interface ProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provider?: AIProviderConfig | null;
    onSave: (provider: AIProviderConfig) => void;
}

export function ProviderDialog({ open, onOpenChange, provider, onSave }: ProviderDialogProps) {
    const [name, setName] = React.useState("");
    const [baseUrl, setBaseUrl] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [showApiKey, setShowApiKey] = React.useState(false);

    const isEditing = !!provider;

    // Reset form when dialog opens/closes or provider changes
    React.useEffect(() => {
        if (open) {
            if (provider) {
                setName(provider.name);
                setBaseUrl(provider.baseUrl);
                setApiKey(provider.apiKey);
            } else {
                setName("");
                setBaseUrl("");
                setApiKey("");
            }
            setShowApiKey(false);
        }
    }, [open, provider]);

    const handleSave = () => {
        const newProvider: AIProviderConfig = {
            id: provider?.id || crypto.randomUUID(),
            name: name.trim() || "自訂提供商",
            baseUrl,
            apiKey,
        };
        onSave(newProvider);
        onOpenChange(false);
    };

    const isValid = name.trim().length > 0 && baseUrl.trim().length > 0 && apiKey.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "編輯提供商" : "新增 AI 提供商"}
                    </DialogTitle>
                    <DialogDescription>
                        配置 AI API 提供商的連線資訊。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Display Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">顯示名稱</Label>
                        <Input
                            id="name"
                            placeholder="例如：OpenAI、DeepSeek、Claude..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            用於識別此提供商配置
                        </p>
                    </div>

                    {/* Base URL */}
                    <div className="grid gap-2">
                        <Label htmlFor="baseUrl">Base URL</Label>
                        <Input
                            id="baseUrl"
                            placeholder="https://api.openai.com/v1"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            API 端點 URL（支援 OpenAI 相容格式）
                        </p>
                    </div>

                    {/* API Key */}
                    <div className="grid gap-2">
                        <Label htmlFor="apiKey">API 金鑰</Label>
                        <div className="relative">
                            <Input
                                id="apiKey"
                                type={showApiKey ? "text" : "password"}
                                placeholder="輸入 API 金鑰..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            金鑰將安全地存儲在本地資料庫中
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid}>
                        {isEditing ? "儲存" : "新增"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
