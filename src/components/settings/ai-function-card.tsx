"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AI_PROVIDERS, AIProvider } from "@/lib/constants/settings";

interface AIFunctionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    fieldPrefix: 'ai.translation' | 'ai.briefing' | 'ai.embedding';
    form: UseFormReturn<any>;
}

export function AIFunctionCard({
    title,
    description,
    icon: Icon,
    fieldPrefix,
    form,
}: AIFunctionCardProps) {
    const [showApiKey, setShowApiKey] = React.useState(false);

    const providerValue = form.watch(`${fieldPrefix}.provider` as any) as AIProvider;
    const isCustomProvider = providerValue === 'custom';

    // 當提供商改變時，自動更新 base_url
    React.useEffect(() => {
        if (providerValue && providerValue !== 'custom') {
            const provider = AI_PROVIDERS[providerValue];
            form.setValue(`${fieldPrefix}.base_url` as any, provider.baseUrl);
        }
    }, [providerValue, fieldPrefix, form]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 提供商選擇 */}
                <FormField
                    control={form.control}
                    name={`${fieldPrefix}.provider` as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>提供商</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇提供商" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                                        <SelectItem key={key} value={key}>
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Base URL - 僅自訂時顯示 */}
                {isCustomProvider && (
                    <FormField
                        control={form.control}
                        name={`${fieldPrefix}.base_url` as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base URL</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://api.example.com/v1"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    自訂提供商的 API 端點 URL
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* API Key */}
                <FormField
                    control={form.control}
                    name={`${fieldPrefix}.api_key` as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>API 金鑰</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="輸入 API 金鑰..."
                                        {...field}
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
                            </FormControl>
                            <FormDescription>
                                您的 API 金鑰將安全地存儲在本地資料庫中
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 模型名稱 */}
                <FormField
                    control={form.control}
                    name={`${fieldPrefix}.model` as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>模型名稱</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={
                                        fieldPrefix === 'ai.embedding'
                                            ? "例如：text-embedding-3-small"
                                            : "例如：gpt-4o、gpt-4o-mini、doubao-seed-1-8-251228..."
                                    }
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                輸入您要使用的 AI 模型名稱
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
