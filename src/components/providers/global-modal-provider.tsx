"use client";

import * as React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ModalType = "alert" | "confirm";

interface ModalState {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
}

interface GlobalModalContextValue {
    alert: (message: string, title?: string) => Promise<void>;
    confirm: (message: string, title?: string) => Promise<boolean>;
}

const GlobalModalContext = React.createContext<GlobalModalContextValue | null>(null);

export function useGlobalModal(): GlobalModalContextValue {
    const context = React.useContext(GlobalModalContext);
    if (!context) {
        throw new Error("useGlobalModal must be used within a GlobalModalProvider");
    }
    return context;
}

export function GlobalModalProvider({ children }: { children: React.ReactNode }) {
    const [modalState, setModalState] = React.useState<ModalState>({
        isOpen: false,
        type: "alert",
        title: "",
        message: "",
    });

    const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

    const openModal = React.useCallback(
        (type: ModalType, message: string, title?: string): Promise<boolean> => {
            return new Promise((resolve) => {
                resolveRef.current = resolve;
                setModalState({
                    isOpen: true,
                    type,
                    title: title || (type === "alert" ? "提示" : "確認"),
                    message,
                });
            });
        },
        []
    );

    const handleClose = React.useCallback((result: boolean) => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
    }, []);

    const contextValue = React.useMemo<GlobalModalContextValue>(
        () => ({
            alert: async (message: string, title?: string) => {
                await openModal("alert", message, title);
            },
            confirm: (message: string, title?: string) => {
                return openModal("confirm", message, title);
            },
        }),
        [openModal]
    );

    return (
        <GlobalModalContext.Provider value={contextValue}>
            {children}
            <AlertDialog open={modalState.isOpen} onOpenChange={(open) => !open && handleClose(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{modalState.title}</AlertDialogTitle>
                        <AlertDialogDescription>{modalState.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {modalState.type === "confirm" && (
                            <AlertDialogCancel onClick={() => handleClose(false)}>取消</AlertDialogCancel>
                        )}
                        <AlertDialogAction onClick={() => handleClose(true)}>確定</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </GlobalModalContext.Provider>
    );
}
