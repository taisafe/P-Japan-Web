"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Languages, FileText, Binary } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { SETTING_DEFAULTS, AI_PROVIDERS } from "@/lib/constants/settings";
import { AIFunctionCard } from "./ai-function-card";

// 提供商驗證
const providerEnum = z.enum(['openai', 'volcengine', 'custom']);

const settingsSchema = z.object({
    // 翻譯功能
    "ai.translation.provider": providerEnum,
    "ai.translation.api_key": z.string(),
    "ai.translation.base_url": z.string(),
    "ai.translation.model": z.string(),
    "ai.translation.enabled": z.boolean(),
    "ai.translation.target_lang": z.string(),

    // 簡報功能
    "ai.briefing.provider": providerEnum,
    "ai.briefing.api_key": z.string(),
    "ai.briefing.base_url": z.string(),
    "ai.briefing.model": z.string(),

    // 向量嵌入功能
    "ai.embedding.provider": providerEnum,
    "ai.embedding.api_key": z.string(),
    "ai.embedding.base_url": z.string(),
    "ai.embedding.model": z.string(),

    // 內容抓取設定
    "fetch.rss_interval_minutes": z.number().min(5).max(1440),
    "fetch.auto_fetch_enabled": z.boolean(),
    "fetch.max_articles_per_source": z.number().min(10).max(200),

    // 邏輯演算法設定
    "algorithm.similarity_threshold": z.number().min(0).max(1),
    "algorithm.keyword_weight": z.number().min(0).max(1),
    "algorithm.embedding_weight": z.number().min(0).max(1),
    "algorithm.recency_decay_hours": z.number().min(1).max(168),
    "algorithm.source_weight_multiplier": z.number().min(0.1).max(5),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
    initialValues: typeof SETTING_DEFAULTS;
    onSave: (values: SettingsFormValues) => Promise<void>;
}

export function SettingsForm({ initialValues, onSave }: SettingsFormProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialValues as SettingsFormValues,
    });

    const handleSubmit = async (values: SettingsFormValues) => {
        setIsLoading(true);
        try {
            await onSave(values);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ai">AI 模型</TabsTrigger>
                        <TabsTrigger value="fetch">內容抓取</TabsTrigger>
                        <TabsTrigger value="algorithm">邏輯演算法</TabsTrigger>
                    </TabsList>

                    {/* AI 模型標籤頁 */}
                    <TabsContent value="ai" className="space-y-4 mt-4">
                        {/* 翻譯功能卡片 */}
                        <AIFunctionCard
                            title="翻譯功能"
                            description="將日文和英文新聞翻譯為目標語言，建議使用較便宜的模型。"
                            icon={Languages}
                            fieldPrefix="ai.translation"
                            form={form}
                        />

                        {/* 翻譯額外設定 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>翻譯設定</CardTitle>
                                <CardDescription>
                                    配置自動翻譯功能的行為。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="ai.translation.enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">啟用自動翻譯</FormLabel>
                                                <FormDescription>
                                                    自動將日文和英文新聞翻譯為目標語言。
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ai.translation.target_lang"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>目標語言</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="選擇語言" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="zh-CN">簡體中文</SelectItem>
                                                    <SelectItem value="zh-TW">繁體中文</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* 簡報功能卡片 */}
                        <AIFunctionCard
                            title="簡報功能"
                            description="生成每日簡報摘要，建議使用能力較強的模型。"
                            icon={FileText}
                            fieldPrefix="ai.briefing"
                            form={form}
                        />

                        {/* 向量嵌入功能卡片 */}
                        <AIFunctionCard
                            title="向量嵌入功能"
                            description="計算文章向量用於事件匹配，需使用 Embedding 模型。"
                            icon={Binary}
                            fieldPrefix="ai.embedding"
                            form={form}
                        />
                    </TabsContent>

                    {/* 內容抓取標籤頁 */}
                    <TabsContent value="fetch" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>RSS 抓取設定</CardTitle>
                                <CardDescription>
                                    配置自動抓取新聞的頻率和數量。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="fetch.auto_fetch_enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">啟用自動抓取</FormLabel>
                                                <FormDescription>
                                                    按照設定的間隔自動抓取 RSS 來源。
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="fetch.rss_interval_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抓取間隔（分鐘）</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    <Slider
                                                        min={5}
                                                        max={120}
                                                        step={5}
                                                        value={[field.value]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>5 分鐘</span>
                                                        <span className="font-medium text-foreground">{field.value} 分鐘</span>
                                                        <span>120 分鐘</span>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="fetch.max_articles_per_source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>每來源最大文章數</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={10}
                                                    max={200}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                每次抓取時，每個來源最多獲取的文章數量。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 邏輯演算法標籤頁 */}
                    <TabsContent value="algorithm" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>事件匹配設定</CardTitle>
                                <CardDescription>
                                    調整事件相似度匹配的演算法參數。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="algorithm.similarity_threshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>相似度閾值</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    <Slider
                                                        min={0}
                                                        max={1}
                                                        step={0.05}
                                                        value={[field.value]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>寬鬆 (0)</span>
                                                        <span className="font-medium text-foreground">{(field.value * 100).toFixed(0)}%</span>
                                                        <span>嚴格 (1)</span>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                當文章相似度超過此閾值時，將被歸類為同一事件。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="algorithm.keyword_weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>關鍵字權重</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-2">
                                                        <Slider
                                                            min={0}
                                                            max={1}
                                                            step={0.1}
                                                            value={[field.value]}
                                                            onValueChange={(value) => field.onChange(value[0])}
                                                        />
                                                        <div className="text-center text-sm font-medium">
                                                            {(field.value * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="algorithm.embedding_weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>向量嵌入權重</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-2">
                                                        <Slider
                                                            min={0}
                                                            max={1}
                                                            step={0.1}
                                                            value={[field.value]}
                                                            onValueChange={(value) => field.onChange(value[0])}
                                                        />
                                                        <div className="text-center text-sm font-medium">
                                                            {(field.value * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="algorithm.recency_decay_hours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>時效衰減（小時）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={168}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                事件熱度隨時間衰減的時間窗口。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="algorithm.source_weight_multiplier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>來源權重倍數</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    <Slider
                                                        min={0.1}
                                                        max={5}
                                                        step={0.1}
                                                        value={[field.value]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>0.1x</span>
                                                        <span className="font-medium text-foreground">{Number(field.value).toFixed(1)}x</span>
                                                        <span>5x</span>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                來源權重對事件熱度的影響倍數。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                儲存中...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                儲存設定
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
