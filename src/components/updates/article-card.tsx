"use client";

import { Article } from "@/lib/services/articles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import Link from "next/link";
import { Newspaper, Calendar, Globe, Check } from "lucide-react";
import { ArticleActions } from "@/components/updates/article-actions";
import { cn } from "@/lib/utils";

// Define strict type for props
export interface ArticleWithRelations extends Article {
    source: {
        id: string;
        name: string;
        url: string;
        weight: number | null;
        type: string; // or specific union type if you prefer
        category: string | null;
        lastFetchedAt?: Date | number | null;
        cron?: string | null;
        createdAt?: Date | number | null;
        updatedAt?: Date | number | null;
    } | null;
    event: unknown | null;
}

interface ArticleCardProps {
    article: ArticleWithRelations;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    isSelectionMode: boolean;
}

export function ArticleCard({ article, isSelected, onToggleSelect, isSelectionMode }: ArticleCardProps) {
    return (
        <div
            className={cn(
                "relative group transition-all duration-200",
                isSelected && "translate-x-2"
            )}
        >
            {/* Selection Checkbox */}
            <div
                className={cn(
                    "absolute -left-10 top-1/2 -translate-y-1/2 transition-opacity duration-200 z-20",
                    isSelectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
            >
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(article.id);
                    }}
                    className={cn(
                        "h-6 w-6 rounded border border-primary/20 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors bg-background",
                        isSelected && "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {isSelected && <Check className="h-4 w-4" />}
                </div>
            </div>

            {/* Delete button positioned absolutely outside the Link */}
            <div className="absolute top-4 right-4 z-10 transition-opacity duration-200">
                <ArticleActions articleId={article.id} />
            </div>

            <div
                className="block cursor-pointer"
                onClick={(e) => {
                    // If clicking the card body in selection mode, toggle selection
                    // Otherwise navigate
                    if (isSelectionMode) {
                        e.preventDefault();
                        onToggleSelect(article.id);
                    }
                }}
            >
                <Link
                    href={`/updates/${article.id}`}
                    className={cn("block", isSelectionMode && "pointer-events-none")}
                    tabIndex={isSelectionMode ? -1 : 0}
                >
                    <Card className={cn(
                        "hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-editorial-pink",
                        isSelected && "border-primary/50 ring-1 ring-primary/50"
                    )}>
                        <CardContent className="p-6 pr-14">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold group-hover:text-editorial-pink transition-colors line-clamp-2 leading-tight">
                                            {article.titleCN || article.title}
                                        </h3>
                                        {article.titleCN && (
                                            <p className="text-sm text-muted-foreground font-medium line-clamp-1 opacity-80 group-hover:opacity-100">
                                                {article.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground hover:bg-muted">
                                            {article.source?.name || "Unknown Source"}
                                        </Badge>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {article.publishedAt ? format(article.publishedAt, "PPP p", { locale: zhTW }) : "未知時間"}
                                        </span>
                                        {article.source?.weight !== undefined && (
                                            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                                W:{article.source.weight}
                                            </Badge>
                                        )}
                                    </div>

                                    {(() => {
                                        const tags = article.tags;
                                        if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
                                        return (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {(tags as string[]).map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs text-editorial-pink border-editorial-pink/30">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {article.source?.type === 'twitter' && (
                                    <div className="hidden md:flex items-center justify-center w-16 text-sky-500">
                                        {/* Could use Twitter icon */}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
