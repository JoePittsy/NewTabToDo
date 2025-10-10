import React, { useState } from "react";
import LinksEditor from "./LinksEditor";
import IconLinksEditor from "./IconLinksEditor";
import { IconLink, Project } from "../ProjectsProvider";
import DialogHeader, { TabDef } from "../DialogHeader";
import { QuickLink } from "@/components/ProjectCard/ProjectCard";

interface EditProjectDialogProps {
    project: Project;
    onSave: (project: Project) => void;
    onCancel: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, onSave, onCancel }) => {
    const TABS: TabDef[] = [
        {
            key: "general",
            label: "General",
        },
        {
            key: "links",
            label: "Links",
        },
        {
            key: "iconLinks",
            label: "Icon Links",
        },
    ];

    const [name, setName] = useState(project.name);
    const [logo, setLogo] = useState(project.logo);
    const [logoBackgroundColor, setLogoBackgroundColor] = useState(project.logoBackgroundColor || "#6c757d");
    const [logoPreview, setLogoPreview] = useState(project.logo);
    const [links, setLinks] = useState<QuickLink[]>(project.quickLinks || []);
    const [iconLinks, setIconLinks] = useState(project.iconLinks || []);

    const [activeTab, setActiveTab] = useState<string>("general");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Only run on mount, not on every render
    React.useEffect(() => {
        // Stringify and parse to create a deep copy
        setLinks(JSON.parse(JSON.stringify(project.quickLinks || [])));
        const iconLinksWithDefault = JSON.parse(JSON.stringify(project.iconLinks || [])).map((link: IconLink) => ({
            ...link,
            iconType: link.iconType || "favicon",
        }));
        setIconLinks(iconLinksWithDefault);
    }, [project]); // Only run once on mount

    function updateLink(path: number[], newLink: QuickLink) {
        setLinks((prev) => {
            // Avoid replacing the whole object, only update the changed field
            const copy = JSON.parse(JSON.stringify(prev));
            let arr = copy;
            for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
            // Only update the changed field, not the whole object
            arr[path[path.length - 1]] = { ...arr[path[path.length - 1]], ...newLink };
            return copy;
        });
    }
    function deleteLink(path: number[]) {
        setLinks((prev) => {
            const copy = JSON.parse(JSON.stringify(prev));
            let arr = copy;
            for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
            arr.splice(path[path.length - 1], 1);
            return copy;
        });
    }
    function addLink(path: number[]) {
        setLinks((prev) => {
            const copy = JSON.parse(JSON.stringify(prev));
            const newLink: QuickLink = { label: "", url: "", children: [] };
            if (path.length === 0) {
                copy.push(newLink);
                return copy;
            }
            let arr = copy;
            // Traverse to the correct parent array
            for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
            // If adding a subfolder (from +Subfolder), add to children of the target
            if (path.length > 0) {
                const parent = arr[path[path.length - 1]];
                if (!parent.children) parent.children = [];
                parent.children.push(newLink);
            }
            return copy;
        });
    }
    function addRootLink() {
        addLink([]);
    }

    function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setLogo(ev.target?.result as string);
                setLogoPreview(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    // Handler for delete
    function handleDelete() {
        setShowDeleteConfirm(true);
    }
    function confirmDelete() {
        onSave({ ...project, name: "__DELETE__", logo: "", quickLinks: [], iconLinks: [], todos: [] });
    }
    function cancelDelete() {
        setShowDeleteConfirm(false);
    }

    return (
        <form
            className="flex flex-col gap-5 w-[600px] h-[600px]"
            onSubmit={(e) => {
                e.preventDefault();
                onSave({
                    ...project,
                    name,
                    logo,
                    logoBackgroundColor,
                    quickLinks: JSON.parse(JSON.stringify(links)),
                    iconLinks: JSON.parse(JSON.stringify(iconLinks)),
                });
            }}
        >
            <DialogHeader
                title={project.name}
                onClose={onCancel}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={TABS}
            />

            {/* Tab content */}
            {activeTab === "general" && (
                <>
                    <label style={{ fontWeight: 500 }}>
                        Name
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mt-1.5 p-2 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100"
                            required
                        />
                    </label>
                    <div className="flex items-center gap-4">
                        <label className="font-medium flex-1">
                            Logo
                            <br />
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1.5 w-full" />
                        </label>
                        {logoPreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLogo("");
                                    setLogoPreview("");
                                }}
                                className="bg-red-400 text-white border-none rounded-md py-2 px-4 cursor-pointer font-semibold self-end mb-1"
                            >
                                Clear Logo
                            </button>
                        )}
                    </div>
                    <label className="font-medium mt-4">
                        Logo Background Color
                        <input
                            type="color"
                            value={logoBackgroundColor}
                            onChange={(e) => setLogoBackgroundColor(e.target.value)}
                            className="w-full mt-1.5 p-2 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100"
                        />
                    </label>
                    <div className="flex flex-col items-center mt-4">
                        {logoPreview ? (
                            <img
                                src={logoPreview}
                                alt="Preview"
                                className="w-14 h-14 rounded-lg object-contain bg-white border border-gray-300"
                            />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-lg flex items-center justify-center text-[1.8em] font-bold text-white"
                                style={{ background: logoBackgroundColor }}
                            >
                                {name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="mt-2 text-sm">Preview</div>
                    </div>
                </>
            )}
            {activeTab === "links" && (
                <div className="overflow-y-auto">
                    <LinksEditor
                        links={links}
                        updateLink={updateLink}
                        deleteLink={deleteLink}
                        addLink={addLink}
                        addRootLink={addRootLink}
                    />
                </div>
            )}
            {activeTab === "iconLinks" && (
                <div className="overflow-y-auto">
                    <IconLinksEditor iconLinks={iconLinks} setIconLinks={setIconLinks} />
                </div>
            )}
            <div className="flex gap-4 justify-end mt-auto">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-transparent text-sky-300 border-none font-semibold text-base cursor-pointer py-2 px-5 rounded-md"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-sky-300 text-zinc-900 border-none font-bold text-base cursor-pointer py-2 px-5 rounded-md"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-400 text-white border-none font-bold text-base cursor-pointer py-2 px-5 rounded-md ml-2"
                >
                    Delete Project
                </button>
            </div>
            {showDeleteConfirm && (
                <div className="fixed inset-0 w-screen h-screen bg-black/45 z-[99999] flex items-center justify-center">
                    <div className="bg-zinc-900 rounded-xl shadow-2xl p-8 pb-6 min-w-[320px] text-center border-2 border-red-400">
                        <div className="text-red-400 font-bold text-lg mb-4">
                            Are you sure you want to delete this project?
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={confirmDelete}
                                className="bg-red-400 text-white border-none font-bold text-base cursor-pointer py-2 px-6 rounded-md"
                            >
                                Delete
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="bg-transparent text-sky-300 border-[1.5px] border-sky-300 font-semibold text-base cursor-pointer py-2 px-6 rounded-md"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default EditProjectDialog;
