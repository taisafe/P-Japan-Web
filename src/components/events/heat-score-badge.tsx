"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface ScoreBreakdown {
    rawScore: number;
    decayFactor: number;
    finalScore: number;
    sourceCount: number;
}

interface HeatScoreBadgeProps {
    score: number | null;
    breakdown?: ScoreBreakdown;
}

export function HeatScoreBadge({ score, breakdown }: HeatScoreBadgeProps) {
    const displayScore = score?.toFixed(0) || "0";

    // Determine color based on score
    const getScoreColor = (s: number | null) => {
        if (!s) return "bg-muted text-muted-foreground";
        if (s >= 50) return "bg-red-500/20 text-red-600 border-red-500/30";
        if (s >= 30) return "bg-orange-500/20 text-orange-600 border-orange-500/30";
        if (s >= 15) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
        return "bg-muted text-muted-foreground";
    };

    const badgeContent = (
        <Badge
            variant="outline"
            className={`whitespace-nowrap font-medium ${getScoreColor(score)}`}
        >
            <Flame className="w-3 h-3 mr-1" />
            {displayScore}
        </Badge>
    );

    if (!breakdown) {
        return badgeContent;
    }

    const decayPercent = ((1 - breakdown.decayFactor) * 100).toFixed(0);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {badgeContent}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs space-y-1">
                        <div className="font-semibold border-b pb-1 mb-1">
                            熱度評分明細
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">獨立來源數:</span>
                            <span className="font-medium">{breakdown.sourceCount}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">原始分數:</span>
                            <span className="font-medium">{breakdown.rawScore.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">時間衰減:</span>
                            <span className="font-medium text-amber-600">-{decayPercent}%</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
                            <span className="font-semibold">最終分數:</span>
                            <span className="font-bold">{breakdown.finalScore}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
