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
import { ArrowLeft, Send, Twitter, FileText } from "lucide-react";
import Link from 'next/link';

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
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            author: "",
            url: "https://twitter.com/",
            content: "",
            type: "twitter",
            isPaywalled: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
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
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            console.error("Manual Submit Error:", error);
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
                <h1 className="font-serif text-4xl font-bold tracking-tight italic">Manual Content Entry</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                        <div className="space-y-8">
                            <Card className="border-t-4 border-t-editorial-pink shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-serif italic text-2xl">Article / Tweet Body</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Subject / Headline</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter a brief summary headline..." className="font-serif italic text-xl border-none bg-muted/20 focus-visible:ring-0 px-0 h-auto" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Full Content Paste</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Paste the tweet text or full article content here..."
                                                        className="min-h-[400px] font-sans text-lg leading-relaxed border-none bg-muted/10 focus-visible:ring-0 px-0 resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Meta Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
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
                                                                <FileText className="h-4 w-4 text-rose-500" /> Web Article
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
                                                <FormLabel>Author / Handle</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." className="text-xs font-mono" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full bg-editorial-pink hover:bg-editorial-pink/90 h-12 text-lg font-serif italic">
                                            <Send className="mr-2 h-5 w-5" />
                                            Publish
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 text-sm text-muted-foreground italic">
                                Note: Manual entries bypass automated scoring buffers and are treated as verified high-priority signals by default.
                            </div>
                        </aside>
                    </div>
                </form>
            </Form>
        </div>
    );
}
