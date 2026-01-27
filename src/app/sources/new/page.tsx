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
                <h1 className="font-serif text-4xl font-bold tracking-tight italic">Register New Source</h1>
            </div>

            <Card className="border-t-4 border-t-editorial-pink shadow-lg">
                <CardHeader>
                    <CardTitle className="font-serif italic text-2xl">Source Identity</CardTitle>
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
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Outlet Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Nikkei Politics" className="font-serif italic text-lg" {...field} />
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
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Region / Platform</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="font-medium">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="jp">Japanese Media</SelectItem>
                                                    <SelectItem value="en">English Media</SelectItem>
                                                    <SelectItem value="twitter">Twitter (X) List/Acc</SelectItem>
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
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">RSS / Home URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." className="font-mono text-sm" {...field} />
                                        </FormControl>
                                        <FormDescription>The primary URL for automated fetching or reference.</FormDescription>
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
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Category Tag</FormLabel>
                                            <FormControl>
                                                <Input placeholder="mainstream, diet, policy..." {...field} />
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
                                            <FormLabel className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Authority Weight (1.0 - 5.0)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.0)}
                                                    className="font-mono font-bold text-editorial-pink"
                                                />
                                            </FormControl>
                                            <FormDescription>Higher weight impacts Heat Score more significantly.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full bg-editorial-pink hover:bg-editorial-pink/90 h-12 text-lg font-serif italic">
                                    <Save className="mr-2 h-5 w-5" />
                                    Save Source Profile
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
