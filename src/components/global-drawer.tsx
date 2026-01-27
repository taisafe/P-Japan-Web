"use client";

import { useGlobalDrawer, useDrawerActions } from "@/store/use-global-drawer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogViewer } from "@/components/log-viewer";

export function GlobalDrawer() {
    const { isOpen, view, data } = useGlobalDrawer();
    const { close } = useDrawerActions();

    const renderContent = () => {
        switch (view) {
            case "LOGS":
                return (
                    <div className="p-4 h-full flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium">System Logs</h3>
                            <p className="text-sm text-muted-foreground">
                                Real-time system events and update status.
                            </p>
                        </div>
                        <LogViewer />
                    </div>
                );
            case "SETTINGS":
                return (
                    <div className="p-4">
                        <h3 className="text-lg font-medium">Settings</h3>
                        <p>Global settings configuration.</p>
                    </div>
                );
            default:
                return (
                    <div className="p-4">
                        <p>No content for view: {view}</p>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (view) {
            case "LOGS": return "System Logs";
            case "SETTINGS": return "Settings";
            default: return "Global Drawer";
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription className="sr-only">
                        {getTitle()} panel
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)]">
                    {renderContent()}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
