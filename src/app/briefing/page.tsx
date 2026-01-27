import { BriefingGenerator } from '@/components/briefing/BriefingGenerator';

export default function BriefingPage() {
    return (
        <div className="container mx-auto py-6 space-y-6 h-screen flex flex-col">
            <div className="flex items-center space-x-2 shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">每日簡報生成</h1>
                <span className="text-muted-foreground text-sm self-end pb-1 ml-2">Daily Briefing</span>
            </div>

            <div className="flex-1 min-h-0">
                <BriefingGenerator />
            </div>
        </div>
    );
}
