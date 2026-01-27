
"use server"

import { PeopleService } from "@/lib/services/people";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPersonAction(data: any) {
    const service = new PeopleService();
    await service.create(data);
    revalidatePath('/people');
    redirect('/people');
}

export async function updatePersonAction(id: string, data: any) {
    const service = new PeopleService();
    await service.update(id, data);
    revalidatePath('/people');
    revalidatePath(`/people/${id}`);
    redirect('/people');
}
