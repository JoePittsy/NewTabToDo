import React from "react";

interface IconLink {
    link: string;
    icon?: string;
    title?: string;
    color?: string;
    text?: string;
    iconType: "favicon" | "custom" | "color"; // New field
}

interface IconLinksEditorProps {
    iconLinks: IconLink[];
    setIconLinks: (iconLinks: IconLink[]) => void;
}

const IconLinksEditor: React.FC<IconLinksEditorProps> = ({ iconLinks, setIconLinks }) => {
    function handleChange(idx: number, field: keyof IconLink, value: string) {
        const updated = iconLinks.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
        setIconLinks(updated);
    }
    function handleAdd() {
        const newLink: IconLink = {
            link: "",
            title: "",
            iconType: "favicon",
        };
        setIconLinks([...iconLinks, newLink]);
    }
    function handleDelete(idx: number) {
        setIconLinks(iconLinks.filter((_, i) => i !== idx));
    }
    function handleIconFile(idx: number, file: File) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            handleChange(idx, "icon", ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    function handleFavicon(idx: number) {
        const url = iconLinks[idx]?.link;
        if (!url) return;
        try {
            const u = new URL(url);
            const favicon = `${u.origin}/favicon.ico`;
            setIconLinks(
                iconLinks.map((item, i) =>
                    i === idx
                        ? {
                              ...item,
                              iconType: "favicon",
                              icon: favicon,
                          }
                        : item
                )
            );
        } catch {
            // Fallback to color mode
            setIconLinks(
                iconLinks.map((item, i) =>
                    i === idx
                        ? {
                              ...item,
                              iconType: "color",
                          }
                        : item
                )
            );
        }
    }
    return (
        <div className="flex flex-col gap-2">
            {iconLinks.map((item, idx) => (
                <IconLinkRow
                    key={idx}
                    idx={idx}
                    item={item}
                    onChange={(updated) => {
                        const updatedLinks = iconLinks.map((it, i) => (i === idx ? updated : it));
                        setIconLinks(updatedLinks);
                    }}
                    onDelete={() => handleDelete(idx)}
                    onIconFile={(file) => handleIconFile(idx, file)}
                    onFavicon={() => handleFavicon(idx)}
                />
            ))}
            <button
                type="button"
                onClick={handleAdd}
                className="text-sky-300 bg-transparent font-semibold text-sm cursor-pointer mt-0.5 p-0 block self-start"
            >
                + Add Icon Link
            </button>
        </div>
    );
};

const IconLinkRow: React.FC<{
    idx: number;
    item: IconLink;
    onChange: (item: IconLink) => void;
    onDelete: () => void;
    onIconFile: (file: File) => void;
    onFavicon: () => void;
}> = ({ idx, item, onChange, onDelete, onIconFile, onFavicon }) => {
    function handleChange(field: keyof IconLink, value: string) {
        onChange({
            ...item,
            [field]: value,
        });
    }

    // When switching to color, clear icon (favicon)
    function handleIconTypeChange(newType: "favicon" | "custom" | "color") {
        if (newType === "color") {
            onChange({
                ...item,
                iconType: "color",
                icon: undefined, // Remove favicon/custom icon
            });
        } else {
            onChange({
                ...item,
                iconType: newType,
            });
            if (newType === "favicon") {
                onFavicon();
            }
        }
    }

    // ...existing code...

    return (
        <div className="grid grid-cols-[1.5fr_1fr_auto] gap-2 p-2 border border-zinc-800 rounded-lg mb-2">
            {/* Left Column - Links */}
            <div className="flex flex-col gap-1">
                <input
                    type="text"
                    value={item.link || ""}
                    onChange={(e) => handleChange("link", e.target.value)}
                    placeholder="Link URL"
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-100"
                />
                <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Title"
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-100"
                />
            </div>

            {/* Middle Column - Controls */}
            <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleIconTypeChange("favicon");
                        }}
                        className="border border-zinc-800 text-sky-300 py-[0.2em] px-[0.4em] rounded cursor-pointer text-sm"
                        style={{ background: item.iconType === "favicon" ? "#3a3f4b" : "none" }}
                    >
                        Favicon
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleIconTypeChange("custom");
                        }}
                        className="border border-zinc-800 text-sky-300 py-[0.2em] px-[0.4em] rounded cursor-pointer text-sm"
                        style={{ background: item.iconType === "custom" ? "#3a3f4b" : "none" }}
                    >
                        Custom
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleIconTypeChange("color");
                        }}
                        className="border border-zinc-800 text-sky-300 py-[0.2em] px-[0.4em] rounded cursor-pointer text-sm"
                        style={{ background: item.iconType === "color" ? "#3a3f4b" : "none" }}
                    >
                        Color
                    </button>
                </div>

                {item.iconType === "color" && (
                    <div className="flex gap-1.5 items-center">
                        <div className="flex items-center gap-1">
                            <label className="text-xs text-sky-300">Color:</label>
                            <input
                                type="color"
                                value={item.color || "#6c757d"}
                                onChange={(e) => handleChange("color", e.target.value)}
                                className="w-7 h-7 p-0 border-none bg-transparent cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-xs text-sky-300">Text:</label>
                            <input
                                type="text"
                                value={item.text || ""}
                                onChange={(e) => handleChange("text", e.target.value)}
                                placeholder="A"
                                maxLength={2}
                                className="w-7 p-[0.2em] rounded border border-zinc-800 bg-zinc-900 text-zinc-100 text-center"
                            />
                        </div>
                    </div>
                )}

                {item.iconType === "custom" && (
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById(`icon-file-input-${idx}`)?.click();
                            }}
                            className="bg-transparent border border-zinc-800 text-sky-300 py-[0.2em] px-[0.4em] rounded cursor-pointer text-sm"
                        >
                            Upload
                        </button>
                        <input
                            id={`icon-file-input-${idx}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onIconFile(file);
                            }}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFavicon();
                            }}
                            className="bg-transparent border border-zinc-800 text-sky-300 py-[0.2em] px-[0.4em] rounded cursor-pointer text-sm"
                        >
                            Fetch Favicon
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column - Preview & Delete */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex justify-center items-center w-12 h-12">
                    {item.iconType === "favicon" && item.icon && (
                        <img src={item.icon} alt="favicon" className="w-7 h-7 object-contain" onError={onFavicon} />
                    )}
                    {item.iconType === "custom" && item.icon && (
                        <img src={item.icon} alt="custom" className="w-7 h-7 object-contain" />
                    )}
                    {item.iconType === "color" && (
                        <div
                            className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-base"
                            style={{ background: item.color || "#6c757d" }}
                        >
                            {item.text || item.title?.[0] || "?"}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onDelete}
                    className="bg-transparent border-none text-red-400 font-bold text-sm cursor-pointer py-[0.1em] px-[0.3em]"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default IconLinksEditor;
