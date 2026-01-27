"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    url: z.string().url("Please enter a valid URL."),
    type: z.enum(["jp", "en", "twitter"]),
    category: z.string().min(1, "Category is required."),
    weight: z.number().min(1.0).max(5.0),
});

export default function NewSourcePage() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            url: "",
            type: "jp",
            category: "mainstream",
            weight: 1.0,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const resp = await fetch("/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (resp.ok) {
                router.push("/sources");
                router.refresh();
            }
        } catch (error) {
            console.error("Submit Error:", error);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/sources">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="font-serif text-4xl font-bold tracking-tight italic">新增情報來源</h1>
            </div>

            <Card className="border-t-4 border-t-editorial-pink shadow-lg">
                <CardHeader>
                    <CardTitle className="font-serif italic text-2xl">來源基本資料</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">媒體名稱</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：日經新聞政治版" className="font-serif italic text-lg" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">地區 / 平台</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="font-medium">
                                                        <SelectValue placeholder="選擇類型" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="jp">日本媒體 (Japanese)</SelectItem>
                                                    <SelectItem value="en">英語媒體 (English)</SelectItem>
                                                    <SelectItem value="twitter">Twitter (X) 帳號/清單</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">RSS 訂閱 / 首頁 URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." className="font-mono text-sm" {...field} />
                                        </FormControl>
                                        <FormDescription>用於自動化抓取的目標網址。</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">分類標籤</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：主流媒體, 國會動態..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">權威權重 (1.0 - 5.0)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.0)}
                                                    className="font-mono font-bold text-editorial-pink"
                                                />
                                            </FormControl>
                                            <FormDescription>權重越高，該來源的文章熱度初始值越高。</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full bg-editorial-pink hover:bg-editorial-pink/90 h-12 text-lg font-serif italic">
                                    <Save className="mr-2 h-5 w-5" />
                                    儲存來源設定
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
