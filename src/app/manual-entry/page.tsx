"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Twitter, FileText, Sparkles } from "lucide-react";
import Link from 'next/link';
import { useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
    title: z.string().min(2, "Title is required for searchability."),
    author: z.string().min(2, "Author is required."),
    url: z.string().url("Please enter a valid URL."),
    content: z.string().min(10, "Content must be more substantial."),
    type: z.enum(["twitter", "web"]),
    isPaywalled: z.boolean(),
});

export default function ManualEntryPage() {
    const router = useRouter();
    const [isExtracting, setIsExtracting] = useState(false);
    const [activeTab, setActiveTab] = useState("write");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            author: "",
            url: "",
            content: "",
            type: "web",
            isPaywalled: false,
        },
    });

    // Watch content for preview
    const contentValue = form.watch("content");



    async function onExtract() {
        const urlToCheck = form.getValues("url");
        if (!urlToCheck) {
            form.setError("url", { message: "Please enter a URL to extract from." });
            return;
        }

        setIsExtracting(true);
        const toastId = toast.loading("Fetching content...");
        try {
            const resp = await fetch("/api/articles/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToCheck }),
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || "Extraction failed");
            }

            const data = await resp.json();

            // Auto-fill form
            form.setValue("title", data.title || "");
            form.setValue("content", data.content || "");
            form.setValue("author", data.author || data.siteName || "");

            // If it seems like a tweet, switch type
            if (urlToCheck.includes("twitter.com") || urlToCheck.includes("x.com")) {
                form.setValue("type", "twitter");
            } else {
                form.setValue("type", "web");
            }
            toast.success("Content extracted successfully!", { id: toastId });

        } catch (error: any) {
            console.error("Extraction error:", error);
            form.setError("url", { message: error.message || "Failed to extract content." });
            toast.error(error.message || "Extraction failed", { id: toastId });
        } finally {
            setIsExtracting(false);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const toastId = toast.loading("Publishing article...");
        try {
            const resp = await fetch("/api/articles/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    publishedAt: new Date(),
                }),
            });
            if (resp.ok) {
                toast.success("Article published successfully!", { id: toastId });
                router.push("/");
                router.refresh();
            } else {
                const data = await resp.json();
                throw new Error(data.error || "Failed to publish");
            }
        } catch (error: any) {
            console.error("Manual Submit Error:", error);
            toast.error(error.message || "Failed to publish article. Please try again.", { id: toastId });
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">手動情報錄入</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                        <div className="space-y-8">
                            <Card className="border-t-4 border-t-editorial-pink shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-2xl font-semibold">文章 / 推文內容</CardTitle>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("write")}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "write" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            編輯
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("preview")}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "preview" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            預覽
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-xs text-muted-foreground">標題 / 主旨</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="輸入簡短的摘要標題..." className="text-xl border-none bg-muted/20 focus-visible:ring-0 px-0 h-auto font-medium" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {activeTab === "write" ? (
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-xs text-muted-foreground">內容全文 (Markdown)</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="在此貼上推文全文或文章內容..."
                                                            className="min-h-[400px] text-lg leading-relaxed border-none bg-muted/10 focus-visible:ring-0 px-0 resize-none font-sans font-normal"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ) : (
                                        <div className="min-h-[400px] p-6 bg-muted/10 rounded-md prose prose-stone max-w-none dark:prose-invert">
                                            {contentValue ? (
                                                <div dangerouslySetInnerHTML={{ __html: contentValue.replace(/\n/g, "<br/>") }} />
                                            ) : (
                                                <p className="text-muted-foreground italic">尚未輸入內容...</p>
                                            )}
                                            {/* Note: A real markdown renderer would be better here, but simple breaklines work for now as a basic preview */}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">快速提取</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>來源連結 URL</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input placeholder="https://..." className="text-xs font-mono" {...field} />
                                                    </FormControl>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="w-full mt-2"
                                                    onClick={onExtract}
                                                    disabled={isExtracting}
                                                >
                                                    {isExtracting ? (
                                                        <>
                                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                                            解析中...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            自動提取內容
                                                        </>
                                                    )}
                                                </Button>
                                                <FormMessage />
                                                <FormDescription className="text-xs">
                                                    輸入網址後點擊提取，系統將嘗試自動抓取標題與正文。
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">中繼資料細節</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>內容類型</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="選擇類型" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="twitter">
                                                            <div className="flex items-center gap-2">
                                                                <Twitter className="h-4 w-4 text-sky-500" /> Twitter (X)
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="web">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-rose-500" /> 網路文章
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="author"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>作者 / ID</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full bg-editorial-pink hover:bg-editorial-pink/90 h-12 text-lg font-medium">
                                            <Send className="mr-2 h-5 w-5" />
                                            發布至簡報系統
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
                                注意：手動錄入的資料將繞過自動評分緩衝區，預設被視為已驗證的高優先級信號。
                            </div>
                        </aside>
                    </div>
                </form>
            </Form>
        </div>
    );
}
