"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { BackupSection } from "@/components/settings/backup-section";
import { SETTING_DEFAULTS, SettingsValues } from "@/lib/constants/settings";
import { saveSettingsAction } from "./actions";

interface SettingsClientProps {
    initialSettings: typeof SETTING_DEFAULTS;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const handleSave = async (values: SettingsValues) => {
        await saveSettingsAction(values);
    };

    return (
        <div className="space-y-6">
            <SettingsForm
                initialValues={initialSettings}
                onSave={handleSave}
            />
            <BackupSection />
        </div>
    );
}

