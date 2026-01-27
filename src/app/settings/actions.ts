"use server";

import { getAllSettings, updateSettings, SETTING_DEFAULTS } from "@/lib/services/settings";
import { revalidatePath } from "next/cache";

export async function getSettingsAction() {
    return await getAllSettings();
}

export async function saveSettingsAction(values: typeof SETTING_DEFAULTS) {
    await updateSettings(values);
    revalidatePath("/settings");
    return { success: true };
}
