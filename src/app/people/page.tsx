
import { PeopleService } from "@/lib/services/people";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function PeoplePage({
    searchParams,
}: {
    searchParams: { q?: string; page?: string };
}) {
    // Await searchParams as required in Next.js 15+ (though this project uses 16.1.5, params are async)
    // Actually in Next.js 15+ searchParams IS async.
    const params = await searchParams;
    const query = params.q || "";
    const page = Number(params.page) || 1;

    const service = new PeopleService();
    // Using simple limit 50 for now
    const { data: people } = await service.list({ query, page, limit: 50 });

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">人物管理</h1>
                <Link href="/people/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增人物
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <form className="flex-1">
                    <Input
                        name="q"
                        placeholder="搜尋人物..."
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                        defaultValue={query}
                    />
                </form>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">頭像</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>職位 / 政黨</TableHead>
                            <TableHead>更新時間</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {people.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    找不到人物。
                                </TableCell>
                            </TableRow>
                        ) : (
                            people.map((person) => (
                                <TableRow key={person.id}>
                                    <TableCell>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={person.imageUrl || ""} alt={person.name} />
                                            <AvatarFallback>{person.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{person.name}</div>
                                        <div className="text-sm text-muted-foreground">{person.nameJa}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{person.role}</div>
                                        <div className="text-xs text-muted-foreground">{person.party}</div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {person.updatedAt ? new Date(person.updatedAt).toLocaleDateString('zh-TW') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/people/${person.id}`}>
                                            <Button variant="ghost" size="sm">編輯</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
