"use server";

import { importAllData } from "@/lib/services/backup";
import { revalidatePath } from "next/cache";

export async function restoreBackupAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const file = formData.get("backupFile") as File | null;

    if (!file) {
        return { success: false, error: "未選擇備份文件。" };
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        const result = await importAllData(data);

        if (result.success) {
            revalidatePath("/");
            revalidatePath("/settings");
        }

        return result;
    } catch (error) {
        console.error("Restore backup action failed:", error);
        if (error instanceof SyntaxError) {
            return { success: false, error: "備份文件不是有效的 JSON 格式。" };
        }
        return { success: false, error: error instanceof Error ? error.message : "還原過程中發生未知錯誤。" };
    }
}
