"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Server } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { AIProviderConfig } from "@/lib/constants/settings";

interface ProviderListProps {
    providers: AIProviderConfig[];
    onAdd: () => void;
    onEdit: (provider: AIProviderConfig) => void;
    onDelete: (providerId: string) => void;
}

export function ProviderList({ providers, onAdd, onEdit, onDelete }: ProviderListProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            AI 提供商管理
                        </CardTitle>
                        <CardDescription>
                            集中管理您的 AI API 提供商配置，然後在各功能中選擇使用。
                        </CardDescription>
                    </div>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        新增提供商
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {providers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">
                            尚未配置任何 AI 提供商
                        </p>
                        <Button onClick={onAdd} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            新增第一個提供商
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {providers.map((provider) => (
                            <div
                                key={provider.id}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{provider.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {provider.baseUrl || '(未設定 URL)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(provider)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(provider.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
