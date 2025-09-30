import { XIcon } from "lucide-react";
import React from "react";

export interface TabDef {
    key: string;
    label: string;
}

interface DialogHeaderProps {
    title: string;
    tabs: TabDef[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    style?: React.CSSProperties;
    className?: string;
    onClose: () => void;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title, tabs, activeTab, setActiveTab, onClose }) => {
    React.useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);
    return (
        <div>
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-2xl text-blue-300">{title}</h2>
                <button
                    onClick={onClose}
                    className="mt-2 p-2 rounded-md text-blue-300 bg-transparent border-none font-semibold cursor-pointer text-lg"
                >
                    <XIcon />
                </button>
            </div>
            <div className="flex gap-0 mb-2 border-b border-gray-300">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={`${
                            activeTab === t.key ? "text-blue-300 font-bold" : "text-gray-500"
                        } bg-transparent border-none cursor-pointer outline-none rounded-t-md py-2 px-4`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DialogHeader;
