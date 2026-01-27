"use server";

import { getAllSettings, updateSettings } from "@/lib/services/settings";
import { SettingsValues } from "@/lib/constants/settings";
import { revalidatePath } from "next/cache";

export async function getSettingsAction() {
    return await getAllSettings();
}

export async function saveSettingsAction(values: SettingsValues) {
    await updateSettings(values);
    revalidatePath("/settings");
    return { success: true };
}
