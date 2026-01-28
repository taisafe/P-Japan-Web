"use client";

import { cn } from "@/lib/utils";
import { format, parseISO, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DateTimelineProps {
    availableDates: string[]; // Format: YYYY-MM-DD
    currentDate?: string;
}

export function DateTimeline({ availableDates, currentDate }: DateTimelineProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleDateSelect = (date: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (date) {
            params.set("date", date);
        } else {
            params.delete("date");
        }
        // Reset page to 1 when changing filters
        params.delete("page");
        router.push(`/updates?${params.toString()}`);
    };

    // Scroll to selected date on mount
    useEffect(() => {
        if (currentDate && scrollRef.current) {
            const selectedElement = document.getElementById(`date-${currentDate}`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentDate]);

    if (availableDates.length === 0) {
        return null;
    }

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    時間軸篩選
                </h3>
                {currentDate && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateSelect(null)}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    >
                        清除篩選
                    </Button>
                )}
            </div>

            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mask-gradient"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)'
                }}
            >
                <button
                    onClick={() => handleDateSelect(null)}
                    className={cn(
                        "flex flex-col items-center justify-center min-w-[4rem] h-14 rounded-lg border transition-all duration-200 text-sm",
                        !currentDate
                            ? "bg-editorial-pink text-white border-editorial-pink shadow-md scale-105"
                            : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border-transparent hover:border-border"
                    )}
                >
                    <span className="font-medium text-xs uppercase tracking-wider">全部</span>
                </button>

                {availableDates.map((dateStr) => {
                    const date = parseISO(dateStr);
                    const isSelected = currentDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            id={`date-${dateStr}`}
                            onClick={() => handleDateSelect(dateStr)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[4.5rem] h-14 rounded-lg border transition-all duration-200 group relative",
                                isSelected
                                    ? "bg-editorial-pink text-white border-editorial-pink shadow-md scale-105 z-10"
                                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border-transparent hover:border-border"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] font-medium uppercase tracking-wider mb-0.5",
                                isSelected ? "text-white/80" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                            )}>
                                {format(date, "MMM", { locale: zhTW })}
                            </span>
                            <span className={cn(
                                "text-lg font-bold leading-none",
                                isSelected ? "text-white" : "text-foreground group-hover:text-editorial-pink transition-colors"
                            )}>
                                {format(date, "d")}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
