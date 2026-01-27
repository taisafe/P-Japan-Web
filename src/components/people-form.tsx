
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    nameJa: z.string().optional(),
    nameKana: z.string().optional(),
    nameEn: z.string().optional(),
    role: z.string().optional(),
    party: z.string().optional(),
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    description: z.string().optional(),
    wikipediaId: z.string().optional(),
})

interface PeopleFormProps {
    initialData?: z.infer<typeof formSchema> & { id?: string }
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
    onCancel?: () => void
}

export function PeopleForm({ initialData, onSubmit, onCancel }: PeopleFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            nameJa: "",
            nameKana: "",
            nameEn: "",
            role: "",
            party: "",
            imageUrl: "",
            description: "",
            wikipediaId: "",
        },
    })

    async function handleWikiSync() {
        const name = form.getValues("nameJa") || form.getValues("name");
        if (!name) return;

        setIsSyncing(true);
        try {
            // In a real app we'd call a server action or API route
            // Here we simulate calling the service? No, we can't import class directly in client component like this usually if it uses node modules (fs etc)
            // But WikiSyncService uses fetch, so it might be safe? 
            // Actually strictly speaking we should use server actions for this.
            // For now, let's assume valid input.

            const response = await fetch(`/api/people/wiki-sync?query=${encodeURIComponent(name)}`);
            const data = await response.json();

            if (data && data.extract) {
                form.setValue("description", data.extract.substring(0, 200) + "...");
            }
            if (data && data.original) {
                form.setValue("imageUrl", data.original.source);
            }
            // This is a placeholder for actual implementations
        } catch (e) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    }

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            await onSubmit(values)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-2 items-end">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Fumio Kishida" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nameJa"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Japanese Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="岸田 文雄" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nameKana"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kana (Reading)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="きしだ ふみお" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="nameEn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>English Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Fumio Kishida" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role / Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Prime Minister" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="party"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Party</FormLabel>
                                            <FormControl>
                                                <Input placeholder="LDP" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                            </FormControl>
                                            {field.value && (
                                                <img src={field.value} alt="Preview" className="h-10 w-10 rounded-full object-cover border" />
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-2 items-end">
                                <FormField
                                    control={form.control}
                                    name="wikipediaId"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Wikipedia ID / Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="岸田文雄" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleWikiSync} disabled={isSyncing}>
                                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Short bio..." className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Person
                    </Button>
                </div>
            </form>
        </Form>
    )
}
