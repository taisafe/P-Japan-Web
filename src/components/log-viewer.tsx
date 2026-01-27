"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, Info, CheckCircle } from "lucide-react";

interface LogEntry {
    id: string;
    level: "info" | "warn" | "error";
    message: string;
    source: string;
    createdAt: string;
}

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logs?limit=100");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const getIcon = (level: string) => {
        switch (level) {
            case "error": return <AlertCircle className="h-4 w-4 text-red-500" />;
            case "warn": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/10 rounded-lg border">
            <div className="flex items-center justify-between p-2 border-b bg-muted/40">
                <span className="text-xs font-mono text-muted-foreground">Live Monitor</span>
                <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading} className="h-6 w-6">
                    <RefreshCcw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>
            <ScrollArea className="flex-1 h-[500px]">
                <div className="flex flex-col gap-1 p-2">
                    {logs.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No logs found.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-2 p-2 rounded hover:bg-muted/50 text-sm border-b border-border/40 last:border-0">
                                <div className="mt-0.5">{getIcon(log.level)}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs text-foreground/80">[{log.source}]</span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed break-all font-mono text-foreground/90">{log.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
