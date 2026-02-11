import { getCurrentWindow } from "@tauri-apps/api/window";
import { ArrowLeft, ArrowRight, Minus, Square, X, MessageSquare, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router";

export function Titlebar() {
    const navigate = useNavigate();
    const appWindow = getCurrentWindow();

    return (
        <div className="titlebar" data-tauri-drag-region>
            <div className="flex items-center gap-1 pl-2">
                <button
                    onClick={() => navigate(-1)}
                    className="titlebar-button"
                    type="button"
                    aria-label="Go back"
                >
                    <ArrowLeft size={16} />
                </button>
                <button
                    onClick={() => navigate(1)}
                    className="titlebar-button"
                    type="button"
                    aria-label="Go forward"
                >
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="flex items-center justify-center flex-1 gap-2 text-sm font-medium text-muted-foreground" data-tauri-drag-region>
                {/* Icon could go here */}
                <span>offline-sqlite</span>
            </div>

            <div className="flex items-center">

                <div className="w-px h-4 mx-2 bg-border" />

                <button
                    className="titlebar-button"
                    onClick={() => appWindow.minimize()}
                    type="button"
                    aria-label="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    className="titlebar-button"
                    onClick={() => appWindow.toggleMaximize()}
                    type="button"
                    aria-label="Maximize"
                >
                    <Square size={14} />
                </button>
                <button
                    className="titlebar-button hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => appWindow.close()}
                    type="button"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
