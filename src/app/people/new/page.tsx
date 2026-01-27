
import { PeopleForm } from "@/components/people-form";
import { createPersonAction } from "../actions";

export default function NewPersonPage() {
    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Add New Person</h1>
                <p className="text-muted-foreground">Add a politician or key figure to the database.</p>
            </div>

            <PeopleForm onSubmit={createPersonAction} />
        </div>
    );
}
