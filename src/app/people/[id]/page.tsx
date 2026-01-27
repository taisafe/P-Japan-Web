
import { PeopleForm } from "@/components/people-form";
import { updatePersonAction } from "../actions";
import { PeopleService } from "@/lib/services/people";
import { notFound } from "next/navigation";

export default async function EditPersonPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const service = new PeopleService();
    const person = await service.get(id);

    if (!person) {
        notFound();
    }

    // Wrap the server action to include the ID
    const bindedUpdateAction = updatePersonAction.bind(null, id);

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Edit Person</h1>
                <p className="text-muted-foreground">Update details for {person.name}</p>
            </div>

            <PeopleForm
                initialData={{
                    ...person,
                    // ensure nulls are converted to undefined or empty strings for the form
                    // especially for optional fields
                    nameJa: person.nameJa || undefined,
                    nameKana: person.nameKana || undefined,
                    nameEn: person.nameEn || undefined,
                    role: person.role || undefined,
                    party: person.party || undefined,
                    imageUrl: person.imageUrl || undefined,
                    description: person.description || undefined,
                    wikipediaId: person.wikipediaId || undefined,
                }}
                onSubmit={bindedUpdateAction}
            />
        </div>
    );
}
