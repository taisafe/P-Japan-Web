"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

import { AIProviderConfig } from "@/lib/constants/settings";

interface AIFunctionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    fieldPrefix: 'ai.translation' | 'ai.briefing' | 'ai.embedding';
    form: UseFormReturn<any>;
    providers: AIProviderConfig[];
}

export function AIFunctionCard({
    title,
    description,
    icon: Icon,
    fieldPrefix,
    form,
    providers,
}: AIFunctionCardProps) {

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
                    name={`${fieldPrefix}.provider_id` as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>AI 提供商</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇提供商" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {providers.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            請先在「AI 提供商」標籤頁新增提供商
                                        </div>
                                    ) : (
                                        providers.map((provider) => (
                                            <SelectItem key={provider.id} value={provider.id}>
                                                {provider.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                選擇用於此功能的 AI 提供商配置
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
