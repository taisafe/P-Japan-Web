"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { SETTING_DEFAULTS } from "@/lib/services/settings";
import { saveSettingsAction } from "./actions";

interface SettingsClientProps {
    initialSettings: typeof SETTING_DEFAULTS;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const handleSave = async (values: typeof SETTING_DEFAULTS) => {
        await saveSettingsAction(values);
    };

    return (
        <SettingsForm
            initialValues={initialSettings}
            onSave={handleSave}
        />
    );
}
