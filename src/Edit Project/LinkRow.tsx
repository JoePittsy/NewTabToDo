import { QuickLink } from "@/components/ProjectCard/ProjectCard";
import React from "react";

interface LinkRowProps {
    link: QuickLink;
    idx: number;
    parentPath: number[];
    updateLink: (path: number[], newLink: QuickLink) => void;
    deleteLink: (path: number[]) => void;
    addLink: (path: number[]) => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ link, idx, parentPath, updateLink, deleteLink, addLink }) => {
    const [label, setLabel] = React.useState(link.label || "");
    const [url, setUrl] = React.useState(link.url || "");
    React.useEffect(() => {
        setLabel(link.label || "");
    }, [link.label]);
    React.useEffect(() => {
        setUrl(link.url || "");
    }, [link.url]);
    return (
        <div className="flex items-center gap-1 mb-0.5 mt-0">
            <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={(e) => updateLink([...parentPath, idx], { label: e.target.value })}
                placeholder="Folder or Link name"
                className="w-30 p-[0.2em] rounded border border-zinc-800 bg-zinc-900 text-zinc-100 text-sm flex-grow"
            />
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => updateLink([...parentPath, idx], { url: e.target.value })}
                placeholder="URL (leave blank for folder)"
                className="w-40 p-[0.2em] rounded border border-zinc-800 bg-zinc-900 text-zinc-100 text-sm flex-grow"
            />
            <button
                type="button"
                onClick={() => deleteLink([...parentPath, idx])}
                className="text-red-400 bg-transparent border-none font-bold text-base cursor-pointer p-0 m-0"
            >
                ✕
            </button>
            <button
                type="button"
                onClick={() => addLink([...parentPath, idx])}
                className="text-sky-300 bg-transparent border-none font-bold text-base cursor-pointer p-0 m-0"
            >
                + Sub
            </button>
        </div>
    );
};

export default LinkRow;
