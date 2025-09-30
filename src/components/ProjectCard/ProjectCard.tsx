import React, { useState, useRef, useEffect } from "react";
import pinSvg from "@/assets/pin.svg";
import unpinSvg from "@/assets/unpin.svg";
import ToDoList, { ToDoItem } from "./ToDoList";
import { DialogProvider } from "../../DialogProvider";
import EditProjectDialog from "../../Edit Project/EditProjectDialog";
import { useProjects, deepCloneProject, Project } from "../../ProjectsProvider";
import "react-contexify/dist/ReactContexify.css";
import { useFormatLink } from "../../SettingsProvider";

import { useDialog } from "../../useDialog";
import ProjectQuickLinks from "./ProjectQuickLinks";

export interface QuickLink {
    label: string;
    url?: string;
    children?: QuickLink[];
}

interface ProjectCardProps {
    project: Project;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, dragHandleProps }) => {
    const dialog = useDialog();
    const { updateProject, deleteProject, closeProject, openProject } = useProjects();
    const [proj, setProj] = useState(() => deepCloneProject(project));
    const [notesValue, setNotesValue] = useState(() => project.notes ?? "");
    const [activeTab, setActiveTab] = useState<"notes" | "todos" | "completed">("todos");
    const notesSaveHandle = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notesEditorRef = useRef<HTMLDivElement | null>(null);
    const projectNameRef = useRef(proj.name);

    const formatLink = useFormatLink();

    useEffect(() => {
        if (notesSaveHandle.current) {
            clearTimeout(notesSaveHandle.current);
            notesSaveHandle.current = null;
        }
        const cloned = deepCloneProject(project);
        setProj(cloned);
        setNotesValue(cloned.notes ?? "");
    }, [project]);

    useEffect(() => {
        projectNameRef.current = proj.name;
    }, [proj.name]);

    useEffect(() => {
        if (notesEditorRef.current && notesEditorRef.current.innerHTML !== notesValue) {
            notesEditorRef.current.innerHTML = notesValue;
        }
    }, [notesValue]);

    function handleEdit() {
        dialog.openDialog(() => (
            <EditProjectDialog
                project={deepCloneProject(proj)}
                onSave={(updatedProject) => {
                    if (updatedProject.name === "__DELETE__") {
                        deleteProject(proj.name);
                        dialog.closeDialog();
                        window.location.reload();
                        return;
                    }
                    if (updatedProject.name !== proj.name) {
                        updateProject(proj.name, updatedProject);
                        setProj(updatedProject);
                        closeProject(proj.name);
                        setTimeout(() => {
                            if (typeof window !== "undefined") {
                                setTimeout(() => openProject(updatedProject.name), 0);
                            }
                        }, 0);
                    } else {
                        setProj(updatedProject);
                        updateProject(proj.name, updatedProject);
                    }
                    dialog.closeDialog();
                }}
                onCancel={dialog.closeDialog}
            />
        ));
    }

    function handleClose() {
        closeProject(proj.name);
    }

    const setTodos = (todos: ToDoItem[]) => {
        setProj((p: Project) => ({ ...p, todos: JSON.parse(JSON.stringify(todos)) }));
        updateProject(proj.name, { todos: JSON.parse(JSON.stringify(todos)) });
    };

    const handleExport = () => {
        const projectData = {
            ...proj,
            // Omit internal state properties
            todos: proj.todos.map((todo) => ({
                text: todo.text,
                completed: todo.completed,
                completedAt: todo.completedAt,
                createdOn: todo.createdOn,
            })),
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${proj.name.replace(/[^a-z0-9]/gi, "_")}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Open all links in the project
    const openAllLinks = () => {
        if (!proj.iconLinks) return;
        proj.iconLinks.forEach((link) => {
            if (link.link) {
                window.open(formatLink(proj.name, link.link), "_blank");
            }
        });
    };

    return (
        <>
            <div className="project-card flex flex-col overflow-hidden w-[520px] h-[80vh] min-h-0 max-h-[80vh] m-8 p-0 text-left text-lg text-zinc-100 bg-zinc-900/70 backdrop-blur-md rounded-xl border border-zinc-700 shadow-lg transition-shadow duration-200 hover:shadow-2xl">
                <div
                    className="ProjectCardQuickActions pt-2 pr-5"
                    style={{ display: "flex", justifyContent: "flex-end", position: "relative", gap: "0em", zIndex: 1 }}
                >
                    {dragHandleProps && (
                        <button
                            style={{ marginRight: "6em" }}
                            aria-label="Drag to reorder"
                            className="bg-transparent border-none text-zinc-400  px-[0.1em] rounded-md mr-0 cursor-grab ml-0"
                            {...dragHandleProps}
                            tabIndex={0}
                        >
                            <img
                                style={{ height: "1em", width: "1em", rotate: "90deg" }}
                                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAgklEQVR4nO3UsQmAQAyFYUWxdFR3cAGHcCOt3EIsrH8JpAqCMVgcmK9+BO4SXlWVDGiB+qvcI6AHZuAEDmACumjOTYdZYzTnAjT6AmuL5NxkV8B+M3CJ5F7RXVlDNOcmByK7km8DVhl2d7XeXCoX2VxGNpfK5koFI5vLyOZS2Vw/dwHed3H44QsrtwAAAABJRU5ErkJggg=="
                                alt="drag-handle"
                            ></img>
                        </button>
                    )}

                    <ProjectQuickLinks proj={proj} formatLink={formatLink} />

                    <button
                        onClick={handleEdit}
                        className="flex items-center justify-center bg-transparent border-none p-1 rounded cursor-pointer all duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
                    >
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAuElEQVR4nO2Uuw3CMBRFXbJBBOtAAUyTJWigJqswRmgQSRtmICUHObKVxAJ/Ypc+5fPTPfaNFCESA6yBO3BOnT0AVIxcROKbl8AKuClBbS4dgRd+9MBuEt6o+UlJrnJuCmLDNeW/Zw4E1FIAD+a0wCZaQGj4VOBRSxEc7hD0RudP47zRH1TvLa4Ie/hWXiZW8DNcnb3lMJWgNTsHPtECG1ngJAuSCHx/1zY6m+AgF1hOB+zdb82IkS9ivt889VHIRQAAAABJRU5ErkJggg=="
                            alt="edit"
                            className="h-4 w-4"
                        ></img>
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex items-center justify-center bg-transparent border-none p-1 rounded cursor-pointer all duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
                    >
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABS0lEQVR4nO2WO04DMRCG9xIUPIIoKUIVOsIBkABxDvLgLHQgEAUlfQg3YbkACLqwdCT60EiOZKH17KzXUVLkl1ay7P317cx6xs6ytVZNwC4wAF6AHPhxT+7m+kArJXAbuAWmVGsGPAF7TaEXQEF9fQPnsdArF0GsxDuMiXTWAOrDbZEDO5Hp1dK+ZQE/kF53lpIJ7d4j4BD4LFmTuQ7QDXinkkkNLHUaUse90/4Hl3HbrcmHhdTTwGPF6APm8LK5kEYa+E0xlsGtUFGugS27+Qs48Dz7wIfBVywC/G7wTVYy1eNlba7+AsvpUgO3lAbSrWggsnYc8P6qDcTB70mvGxXqHfzS2FNpAmxWgh38xHjjsByLZyaoBx8muAgMakHnkkM8Mu2S3tOsiYAN4NrtTEuUj+Z/WuNm0gOegVfXXgs3HkmdVpbMWtkS9AcczgesBTVL2QAAAABJRU5ErkJggg=="
                            alt="cancel"
                            className="h-4 w-4"
                        ></img>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center bg-transparent border-none p-1 rounded cursor-pointer all duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
                    >
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABiklEQVR4nO3Wu2sVQRiG8fUCUYOSJp0xIEgI1raS1ElQQfAPMNimsEwjKcQyWGuRQAiBdLm0SfACBluFaJVOtPCSRtT4k4E5sBmyu+csew4IedpvZp7dd7+Z2Sw74X8HZzCOp9jHi27KzmEKz/HFUfabll2IskV8V8x8E7JBTGMDPwtEf5PaWF3ZFTzAGn4r5wBLUS7GfrYT2VXM4GVukSo+4m4S+7N2ZNfxCO91zmZMJp07USXdVo+QxlyIE+tJ7Ufo9irx6xrSEOntOD/IU1baifk8FjqQfgifJs69VdAH9yrFuQcI3furQhoiHYjjR/DtmDFhO11qWxwXu4lPxywW3uoJTsdxF/Gu6OE6krbAZbxJGuVOrn4KqyWp3M/qgr6wD7GH0aQWtl0Rf8IJV1vcIt0SmMRhiXgnaxpcw1flzDQt7StppnwDDjcqDsT7toy3WRcv/N0S8WxXxAEM4XOB+Ej3N078p0rv5r2uSlvgYSJ+nPUKLOfEN3op7scrbIVjtGfiE7I2+AcEHXWoJXkgBAAAAABJRU5ErkJggg=="
                            alt="filled-sent"
                            className="h-4 w-4"
                        ></img>
                    </button>

                    <button
                        aria-label={proj.pinned ? "Unpin project" : "Pin project"}
                        onClick={(e) => {
                            e.stopPropagation();
                            setProj((prev) => {
                                const updated = { ...prev, pinned: !prev.pinned };
                                updateProject(proj.name, updated);
                                return updated;
                            });
                        }}
                        className="flex items-center justify-center bg-transparent border-none p-1 rounded cursor-pointer all duration-200 ease-in-out hover:bg-white/10 hover:scale-105"
                    >
                        {proj.pinned ? (
                            <img src={unpinSvg} alt="Pinned" className="h-4 w-4" />
                        ) : (
                            <img src={pinSvg} alt="Unpinned" className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <div className="flex items-center -mt-4 pl-8 gap-5">
                    {proj.logo ? (
                        <img
                            src={proj.logo}
                            alt={proj.name + " logo"}
                            className="w-14 h-14 rounded-lg bg-[var(--logo-bg,#fff)] object-cover shadow-md "
                        />
                    ) : (
                        <div
                            className="
                                    flex items-center justify-center 
                                    font-bold text-[1.8em] text-white 
                                    shadow-sm rounded-md 
                                    w-14 h-14 min-w-14 min-h-14 max-w-14 max-h-14 aspect-square
                                "
                            style={{ background: proj.logoBackgroundColor || "#6c757d" }}
                        >
                            {proj.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="w-full">
                        <h2 className="text-2xl font-bold">{proj.name}</h2>
                    </div>
                </div>

                <div className="h-14 pl-8 pt-2 flex items-center gap-0.5">
                    <div
                        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                        <button
                            onClick={openAllLinks}
                            className="flex flex-col items-center justify-center no-underline min-w-11 min-h-11 rounded-lg transition-colors duration-150 p-1 bg-transparent border-none outline-none cursor-pointer relative"
                            tabIndex={0}
                            aria-describedby={`all-links-tooltip-${proj.name}`}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.12)";
                                const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
                                if (tooltip) tooltip.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
                                if (tooltip) tooltip.style.opacity = "0";
                            }}
                            onFocus={() => {
                                const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
                                if (tooltip) tooltip.style.opacity = "1";
                            }}
                            onBlur={() => {
                                const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
                                if (tooltip) tooltip.style.opacity = "0";
                            }}
                        >
                            <img
                                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAs0lEQVR4nO3SMQ6DMAyFYS4B6hFQT5JztwNDO5WheypVvcWPQJkQCXYwRa3yRkT8OY6rquQXA1yJpzsKZjd41kQNPL4KAw3QB68XwYADXujyAc4RtJHC3hIN30Xw+k/rb/oETqqaZMCxm862/WIKJ8Y7jV/T/ZQt4wVa4L0LTGK8YeEwh0kskqb5HPi2dFNNjVy4A+5LqLSGzSGLGhQ4IwUW5UjYYxOvhZ0BPp53ykGV/FkG5WgPFpZBmkQAAAAASUVORK5CYII="
                                alt="external-link"
                                className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 shadow-sm transition-transform duration-150 mb-0.5 bg-white object-contain"
                                style={{ background: "rgba(255, 255, 255, 0.1)", border: 0 }}
                            />
                        </button>
                        <span
                            id={`all-links-tooltip-${proj.name}`}
                            className="pointer-events-none opacity-0 absolute bottom-10 left-1/2 -translate-x-1/2 
bg-zinc-800 text-zinc-100 rounded-md px-2.5 py-1 text-[0.95em] font-medium 
whitespace-pre shadow-lg z-[100] transition-opacity duration-75 
max-w-[220px] text-ellipsis overflow-hidden border border-zinc-700
"
                            role="tooltip"
                        >
                            Open all links
                        </span>
                    </div>

                    {proj.iconLinks?.map((link, idx) => {
                        const tooltipId = `icon-link-tooltip-${proj.name.replace(/\s+/g, "-")}-${idx}`;
                        let displayContent;
                        if (link.icon) {
                            displayContent = (
                                <img
                                    src={link.icon}
                                    alt={link.title || "Icon"}
                                    className="icon-h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 shadow-sm transition-transform duration-150 mb-0.5 bg-white object-contain"
                                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                />
                            );
                        } else {
                            const displayText =
                                link.text ||
                                (link.title ? link.title.charAt(0) : link.link.split("/")[2]?.charAt(0) || "?");
                            // Use link.color if iconType is 'color', else fallback to project color or default
                            const bgColor =
                                link.iconType === "color" && link.color
                                    ? link.color
                                    : proj.logoBackgroundColor || "#6c757d";
                            displayContent = (
                                <div
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 shadow-sm transition-transform duration-150 font-bold text-lg mb-0.5 bg-gray-500 text-white"
                                    style={{ background: bgColor, color: "#fff" }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                    {displayText.charAt(0).toUpperCase()}
                                </div>
                            );
                        }
                        return (
                            <div
                                key={idx}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <a
                                    href={formatLink(project.name, link.link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center no-underline min-w-11 min-h-11 rounded-lg transition-colors duration-150 p-1 bg-transparent border-none outline-none cursor-pointer relative"
                                    tabIndex={0}
                                    aria-describedby={tooltipId}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            window.open(formatLink(project.name, link.link), "_blank");
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        const tooltip = document.getElementById(tooltipId);
                                        if (tooltip) tooltip.style.opacity = "1";
                                    }}
                                    onMouseLeave={() => {
                                        const tooltip = document.getElementById(tooltipId);
                                        if (tooltip) tooltip.style.opacity = "0";
                                    }}
                                    onFocus={() => {
                                        const tooltip = document.getElementById(tooltipId);
                                        if (tooltip) tooltip.style.opacity = "1";
                                    }}
                                    onBlur={() => {
                                        const tooltip = document.getElementById(tooltipId);
                                        if (tooltip) tooltip.style.opacity = "0";
                                    }}
                                >
                                    {displayContent}
                                    <span
                                        id={tooltipId}
                                        className="pointer-events-none opacity-0 absolute bottom-10 left-1/2 -translate-x-1/2 
bg-zinc-800 text-zinc-100 rounded-md px-2.5 py-1 text-[0.95em] font-medium 
whitespace-pre shadow-lg z-[100] transition-opacity duration-75 
max-w-[220px] text-ellipsis overflow-hidden border border-zinc-700
"
                                        role="tooltip"
                                    >
                                        {link.title || link.link}
                                    </span>
                                </a>
                            </div>
                        );
                    })}
                </div>

                {/* Tab Navigation */}
                {/* DaisyUI tabs-lift with tab-content, unique name per project */}

                <div className="flex flex-col h-full overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-zinc-700 bg-zinc-800 rounded-t-lg">
                        <button
                            onClick={() => setActiveTab("todos")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                activeTab === "todos"
                                    ? "border-zinc-400 text-zinc-200 bg-zinc-700"
                                    : "border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50"
                            }`}
                            aria-label="ToDo"
                        >
                            ToDo
                        </button>
                        <button
                            onClick={() => setActiveTab("completed")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                activeTab === "completed"
                                    ? "border-zinc-400 text-zinc-200 bg-zinc-700"
                                    : "border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50"
                            }`}
                            aria-label="Completed"
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setActiveTab("notes")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                activeTab === "notes"
                                    ? "border-zinc-400 text-zinc-200 bg-zinc-700"
                                    : "border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50"
                            }`}
                            aria-label="Notes"
                        >
                            Notes
                        </button>
                    </div>

                    {/* Tab content blocks stacked below the tab group, always rendered, only one visible */}
                    <div className="flex-1 overflow-scroll bg-zinc-800 rounded-b-lg border border-zinc-700 border-t-0">
                        {/* To Do Tab */}
                        <div
                            className="contents"
                            style={{
                                display: activeTab === "todos" ? "block" : "none",
                            }}
                        >
                            <div
                                className="flex flex-col overflow-hidden pt-4"
                                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                            >
                                <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                                    <ToDoList todos={proj.todos} setTodos={setTodos} />
                                </div>
                            </div>
                        </div>

                        {/* Completed Tab */}
                        <div
                            // className="contents"
                            className="contents"
                            style={{
                                display: activeTab === "completed" ? "block" : "none",
                            }}
                        >
                            <div
                                className="flex flex-col overflow-hidden pt-4"
                                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                            >
                                <button
                                    onClick={() => {
                                        const updatedTodos = proj.todos.filter((todo: ToDoItem) => !todo.completed);
                                        setProj((prev: Project) => ({ ...prev, todos: updatedTodos }));
                                        updateProject(proj.name, { todos: updatedTodos });
                                    }}
                                    className="bg-red-500 text-white border-none rounded px-3 py-1 cursor-pointer font-semibold m-auto"
                                >
                                    Clear All
                                </button>
                                <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                                    {/* Added a flag, this renders only completed todos with input bar */}
                                    <ToDoList todos={proj.todos} setTodos={setTodos} showOnlyCompleted />
                                </div>
                            </div>
                        </div>

                        {/* Notes Tab */}
                        <div
                            className="contents"
                            style={{
                                display: activeTab === "notes" ? "block" : "none",
                                height: "100%",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    padding: "0.5em",
                                }}
                            >
                                <textarea
                                    value={notesValue}
                                    onChange={(e) => {
                                        setNotesValue(e.target.value);
                                        if (notesSaveHandle.current) clearTimeout(notesSaveHandle.current);
                                        notesSaveHandle.current = setTimeout(() => {
                                            setProj((prev: Project) => {
                                                const updated = { ...prev, notes: e.target.value };
                                                updateProject(prev.name, updated);
                                                return updated;
                                            });
                                        }, 500);
                                    }}
                                    className="flex-1 p-2 min-h-[100px] border border-zinc-700 rounded-lg bg-zinc-800"
                                    style={{ height: "100%", resize: "none" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const ProjectCardWithProviders = (props: ProjectCardProps) => (
    <DialogProvider>
        <ProjectCard {...props} />
    </DialogProvider>
);

export default ProjectCardWithProviders;
