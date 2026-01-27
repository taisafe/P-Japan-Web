
import { PeopleForm } from "@/components/people-form";
import { createPersonAction } from "../actions";

export default function NewPersonPage() {
    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">新增人物</h1>
                <p className="text-muted-foreground">新增政治人物或關鍵人物到資料庫。</p>
            </div>

            <PeopleForm onSubmit={createPersonAction} />
        </div>
    );
}
