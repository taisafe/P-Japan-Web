import { Settings } from "lucide-react";
import { getSettingsAction } from "./actions";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const settings = await getSettingsAction();

    return (
        <div className="flex flex-col gap-6 px-6 pt-6 pb-10">
            <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Settings className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">系統設定</h1>
                    <p className="text-sm text-muted-foreground">
                        配置 AI、內容抓取和演算法參數
                    </p>
                </div>
            </header>

            <SettingsClient initialSettings={settings} />
        </div>
    );
}
