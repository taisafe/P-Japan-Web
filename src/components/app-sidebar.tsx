"use client";

import * as React from "react";
import {
    Home,
    Database,
    Users,
    Settings,
    FileText,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
    {
        title: "儀表板",
        url: "/",
        icon: Home,
    },
    {
        title: "情報來源",
        url: "/sources",
        icon: Database,
    },
    {
        title: "人物追蹤",
        url: "/people",
        icon: Users,
    },
    {
        title: "手動錄入",
        url: "/manual-entry",
        icon: FileText,
    },
    {
        title: "系統設置",
        url: "/settings",
        icon: Settings,
    },
];

import { useDrawerActions } from "@/store/use-global-drawer";

export function AppSidebar() {
    const { open } = useDrawerActions();

    const handleManualUpdate = async () => {
        // Optimistically open the drawer to show logs
        open("LOGS");
        try {
            await fetch("/api/manual-update", { method: "POST" });
        } catch (error) {
            console.error("Failed to trigger update", error);
        }
    };

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-editorial-pink text-white">
                        <span className="font-serif text-xl font-bold italic">J</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                        日本政情簡報
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="px-6 group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url} className="px-6 py-6 h-auto">
                                            <item.icon className="scale-110" />
                                            <span className="font-medium">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
