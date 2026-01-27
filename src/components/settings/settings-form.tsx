"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { SETTING_DEFAULTS } from "@/lib/services/settings";

const settingsSchema = z.object({
    // AI 與翻譯設定
    "ai.openai_api_key": z.string(),
    "ai.openai_model": z.string(),
    "ai.translation_enabled": z.boolean(),
    "ai.translation_target_lang": z.string(),

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
    const [showApiKey, setShowApiKey] = React.useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialValues,
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
                        <TabsTrigger value="ai">AI 與翻譯</TabsTrigger>
                        <TabsTrigger value="fetch">內容抓取</TabsTrigger>
                        <TabsTrigger value="algorithm">邏輯演算法</TabsTrigger>
                    </TabsList>

                    {/* AI 與翻譯標籤頁 */}
                    <TabsContent value="ai" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>OpenAI 設定</CardTitle>
                                <CardDescription>
                                    設定 OpenAI API 金鑰和模型，用於事件匹配和翻譯功能。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="ai.openai_api_key"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API 金鑰</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showApiKey ? "text" : "password"}
                                                        placeholder="sk-..."
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
                                                您的 OpenAI API 金鑰將安全地存儲在本地資料庫中。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ai.openai_model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>模型名稱</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="例如：gpt-4o、gpt-4o-mini、claude-3-opus..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                輸入您要使用的 AI 模型名稱。
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>翻譯設定</CardTitle>
                                <CardDescription>
                                    配置自動翻譯功能。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="ai.translation_enabled"
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
                                    name="ai.translation_target_lang"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>目標語言</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
