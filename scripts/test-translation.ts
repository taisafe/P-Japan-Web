
import { translationService } from '@/lib/services/translator';
import { getSettings } from '@/lib/services/settings';

async function testTranslation() {
    console.log("Starting Translation Test...");

    // 1. Check Settings
    console.log("Checking AI Settings...");
    try {
        const settings = await getSettings(['ai.translation.provider_id', 'ai.providers']);
        console.log("Provider ID:", settings['ai.translation.provider_id']);
        const providers = settings['ai.providers'] as any[] || [];
        console.log("Providers found:", providers.length);
        const provider = providers.find((p: any) => p.id === settings['ai.translation.provider_id']);
        if (provider) {
            console.log("Active Provider:", provider.name, "BaseURL:", provider.baseUrl);
        } else {
            console.error("Active Provider NOT FOUND in providers list!");
        }
    } catch (e) {
        console.error("Error reading settings:", e);
    }

    // 2. Test Translation
    console.log("Attempting translation...");
    try {
        const result = await translationService.translateTitle("これはテストです");
        console.log("Translation Result:", result);
    } catch (e: any) {
        console.error("Translation Failed:", e);
    }
}

testTranslation().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
