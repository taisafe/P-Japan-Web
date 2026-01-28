import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GlobalModalProvider } from "@/components/providers/global-modal-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalDrawer } from "@/components/global-drawer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Japan Politics Daily Brief",
  description: "Aggregated news and insights on Japanese politics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalModalProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="md:ml-[16rem] transition-[margin] bg-background">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <ThemeToggle />
                </header>
                <main className="p-6">
                  {children}
                </main>
              </SidebarInset>
              <GlobalDrawer />
            </SidebarProvider>
          </GlobalModalProvider>
        </ThemeProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
