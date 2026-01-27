
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save, Search, Wand2 } from "lucide-react"

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
    name: z.string().min(1, "必須填寫名稱"),
    nameJa: z.string().optional(),
    nameKana: z.string().optional(),
    nameEn: z.string().optional(),
    role: z.string().optional(),
    party: z.string().optional(),
    imageUrl: z.string().url("必須是有效的網址").optional().or(z.literal("")),
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
    const [isSmartFilling, setIsSmartFilling] = useState(false)
    const [smartFillQuery, setSmartFillQuery] = useState("")
    const [smartFillError, setSmartFillError] = useState<string | null>(null)

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

    async function handleSmartFill() {
        if (!smartFillQuery.trim()) return;

        setIsSmartFilling(true);
        setSmartFillError(null);

        try {
            const { autofillPersonAction } = await import("@/app/actions/people-ai");
            const result = await autofillPersonAction(smartFillQuery);

            if (!result.success) {
                setSmartFillError(result.error || "自動填充失敗");
                return;
            }

            if (result.data) {
                form.setValue("name", result.data.name);
                form.setValue("nameJa", result.data.nameJa);
                form.setValue("nameKana", result.data.nameKana);
                form.setValue("nameEn", result.data.nameEn);
                form.setValue("role", result.data.role);
                form.setValue("party", result.data.party);
                form.setValue("description", result.data.description);
                form.setValue("imageUrl", result.data.imageUrl);
                form.setValue("wikipediaId", result.data.wikipediaId);
            }
        } catch (e) {
            console.error(e);
            setSmartFillError("自動填充時發生錯誤");
        } finally {
            setIsSmartFilling(false);
        }
    }

    async function handleWikiSync() {
        const name = form.getValues("nameJa") || form.getValues("name");
        if (!name) return;

        setIsSyncing(true);
        try {
            const response = await fetch(`/api/people/wiki-sync?query=${encodeURIComponent(name)}`);
            const data = await response.json();

            if (data && data.extract) {
                form.setValue("description", data.extract.substring(0, 200) + "...");
            }
            if (data && data.original) {
                form.setValue("imageUrl", data.original.source);
            }
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
                {/* Smart Fill Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Wand2 className="h-5 w-5" />
                                <span className="font-semibold">智能填寫</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                輸入維基百科連結或人物姓名，自動填寫所有欄位。
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="維基百科連結 或 人物名稱（如：岸田文雄）"
                                    value={smartFillQuery}
                                    onChange={(e) => setSmartFillQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSmartFill();
                                        }
                                    }}
                                    disabled={isSmartFilling}
                                />
                                <Button
                                    type="button"
                                    onClick={handleSmartFill}
                                    disabled={isSmartFilling || !smartFillQuery.trim()}
                                >
                                    {isSmartFilling ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Wand2 className="mr-2 h-4 w-4" />
                                    )}
                                    {isSmartFilling ? "填寫中..." : "自動填寫"}
                                </Button>
                            </div>
                            {smartFillError && (
                                <p className="text-sm text-destructive">{smartFillError}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-2 items-end">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>顯示名稱</FormLabel>
                                            <FormControl>
                                                <Input placeholder="岸田文雄" {...field} />
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
                                            <FormLabel>日文名稱</FormLabel>
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
                                            <FormLabel>假名 (讀音)</FormLabel>
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
                                        <FormLabel>英文名稱</FormLabel>
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
                                            <FormLabel>職位 / 頭銜</FormLabel>
                                            <FormControl>
                                                <Input placeholder="內閣總理大臣" {...field} />
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
                                            <FormLabel>政黨</FormLabel>
                                            <FormControl>
                                                <Input placeholder="自民黨" {...field} />
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
                                        <FormLabel>圖片網址</FormLabel>
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
                                            <FormLabel>維基百科 ID / 標題</FormLabel>
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
                            <FormLabel>描述</FormLabel>
                            <FormControl>
                                <Textarea placeholder="簡短簡介..." className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            取消
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        儲存人物
                    </Button>
                </div>
            </form>
        </Form>
    )
}
