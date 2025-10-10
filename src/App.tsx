import { ProjectsProvider, useProjects, Project, isProjectEffectivelyPinned } from "./ProjectsProvider";
import EditProjectDialog from "./Edit Project/EditProjectDialog";
import { DialogProvider } from "./DialogProvider";
import { SettingsProvider, useSettings } from "./SettingsProvider";
import { Bars4Icon } from "@heroicons/react/24/outline";
import FireworkEffect from "./FireworkEffect";
import CommandPalette, { Action } from "./CommandPalette";
import { useState, useEffect } from "react";
import ProjectCard from "./components/ProjectCard/ProjectCard";
import "./App.css";
import {
    DndContext as ProjectDndContext,
    closestCenter as projectClosestCenter,
    PointerSensor as ProjectPointerSensor,
    useSensor as useProjectSensor,
    useSensors as useProjectSensors,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove as projectArrayMove,
    SortableContext as ProjectSortableContext,
    useSortable as useProjectSortable,
    verticalListSortingStrategy as projectVerticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDialog } from "./useDialog";
import { PsychedelicSpiral } from './components/ui/shadcn-io/psychedelic-spiral';
import PlusIcon from '@heroicons/react/20/solid/PlusIcon';

function App() {
    const { projects, addProject, openedProjects, openProject, setOpenedProjects } = useProjects();
    const dialog = useDialog();
    const [commandOpen, setCommandOpen] = useState(false);
    // Snap preview state for DnD drop target
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    // Replace single firework state with an array of active fireworks
    const [fireworks, setFireworks] = useState<number[]>([]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCommandOpen(true);
            }
        }
        window.addEventListener("keydown", onKeyDown);

        // Horizontal scroll wheel binding for MAIN container only when not over ProjectCards
        const main = document.getElementById("MAIN");
        function onWheel(e: WheelEvent) {
            if (!main) return;
            // Ignore if hovering directly over a ProjectCard
            if ((e.target as HTMLElement).closest(".project-card")) return;
            // Scroll horizontally using vertical wheel movement
            main.scrollLeft += e.deltaY;
        }
        if (main) main.addEventListener("wheel", onWheel);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            if (main) main.removeEventListener("wheel", onWheel);
        };
    }, []);

    useEffect(() => {
        // On mount, open up to 5 effectively pinned projects (manually pinned OR with todos)
        if (openedProjects.length === 0 && projects.length > 0) {
            // Only consider effectively pinned projects
            const effectivelyPinned = projects.filter((p) => isProjectEffectivelyPinned(p));

            // Sort by: manually pinned first, then by number of uncompleted to-dos (descending),
            // then by most recent to-do createdOn
            const sorted = [...effectivelyPinned].sort((a, b) => {
                // Manually pinned projects come first
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;

                // Then sort by number of uncompleted to-dos (descending)
                const aUncompleted = a.todos?.filter((t) => !t.completed).length ?? 0;
                const bUncompleted = b.todos?.filter((t) => !t.completed).length ?? 0;
                if (bUncompleted !== aUncompleted) return bUncompleted - aUncompleted;

                // If tie, sort by most recent to-do createdOn
                const aLatest = Math.max(...(a.todos?.map((t) => t.createdOn || 0) ?? [0]));
                const bLatest = Math.max(...(b.todos?.map((t) => t.createdOn || 0) ?? [0]));
                return bLatest - aLatest;
            });

            const top5 = sorted.slice(0, 5).map((p) => p.name);
            if (top5.length > 0) setOpenedProjects(top5);
        }
        // Only run when projects change or openedProjects change
    }, [projects, openedProjects.length, setOpenedProjects]);

    useEffect(() => {
        // Listen for custom event to trigger fireworks globally
        function onFireworkEvent() {
            setFireworks((fw) => [...fw, Date.now() + Math.random()]);
        }
        window.addEventListener("firework", onFireworkEvent);
        return () => window.removeEventListener("firework", onFireworkEvent);
    }, []);

    function handleCreateProject(initialName?: string) {
        const emptyProject: Project = {
            name: initialName || "",
            logo: "",
            todos: [],
            quickLinks: [],
            iconLinks: [],
        };
        dialog.openDialog(() => (
            <EditProjectDialog
                project={emptyProject}
                onSave={(proj) => {
                    addProject(proj);
                    openProject(proj.name); // Open the new project automatically
                    dialog.closeDialog();
                }}
                onCancel={dialog.closeDialog}
            />
        ));
    }

    function handlePaletteChange(item: Action) {
        if (item && (item.query || item.query === "")) {
            setCommandOpen(false);
            setTimeout(() => handleCreateProject(item.query), 0);
        } else if (item && item.url) {
            window.location.href = item.url;
        }
    }

    // DnD for open projects
    const sensors = useProjectSensors(useProjectSensor(ProjectPointerSensor));
    const openProjectObjs = openedProjects
        .map((name) => projects.find((p) => p.name === name))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setDropTargetId(null); // Clear snap preview
        if (!over || active.id === over.id) return;
        const oldIndex = openedProjects.indexOf(active.id as string);
        const newIndex = openedProjects.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;
        setOpenedProjects(projectArrayMove(openedProjects, oldIndex, newIndex));
    }

    function handleDragOver(event: any) {
        const { over } = event;
        setDropTargetId((over?.id as string) ?? null);
    }

    const settings = useSettings();

    // Memoize the spiral only if enabled, so it spins correctly and unmounts/remounts on toggle
    // Tried without memo, the spiral would stop moving when any state changed in App 

    // NOTE: spiral stops spinning when auto re-render when code saves, need a proper f5
    // Should not be a issue in production
    const spiral = useMemo(() => {
        if (settings && settings.Background?.useSpinningBackground) {
            return (
                <PsychedelicSpiral
                    color1="#871d87"
                    color2="#b2dfdf"
                    color3="#0c204e"
                    pixelFilter={1200}
                    lighting={0.2}
                    // isRotate={true}
                    className="fixed inset-0 -z-10"
                />
            );
        }
        return null;
        // Reload this component whenever the background settings changes
    }, [settings?.Background?.useSpinningBackground]);


    return (
        <>
            {spiral}

            {fireworks.map(id => (
                <FireworkEffect key={id} trigger={true} onDone={() => setFireworks(fw => fw.filter(f => f !== id))} multiple={8} />
            ))}
            <CommandPalette open={commandOpen} setOpen={setCommandOpen} onChange={handlePaletteChange} />
            {/* Top-right buttons */}

            
            <div className="fixed top-2 right-4 z-[10010] flex gap-2 ">
                <button
                    type="button"
                    className="cursor-pointer rounded-full bg-zinc-800 p-3 text-white shadow-xs hover:bg-zinc-600 transition-colors duration-200"
                    onClick={() => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.accept = ".json";
                        fileInput.onchange = (e: Event) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const projectData = JSON.parse(event.target?.result as string);
                                        addProject(projectData);
                                    } catch (error) {
                                        console.error("Error parsing project file:", error);
                                        alert("Invalid project file format");
                                    }
                                };
                                reader.readAsText(file);
                            }
                        };
                        fileInput.click();
                    }}
                    title="Import Project"
                >
                    <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAo0lEQVR4nO3TPQ6CMBiH8R7HAScccdd4Ekm8pN4ETE05ARMPIWFwkY++b9vBPvM//SVNa0wudcANeLOtHrhrwS37GoBaA/Zpwh8pYDmOLH8ceYPXg0OnPhTsgBKofg1CwA4o5u0pFtwBx3l3AD4x4G4rqg2XwnNeqeCn1lXbhW3wx2Vjwcm+0zc+oWciw6tleLW/hFsFt/GBr0K8AS674ZxRbgSeqR+wtpNp2QAAAABJRU5ErkJggg=="
                        alt="import"
                    ></img>
                </button>
                <button
                    type="button"
                    className="cursor-pointer rounded-full bg-zinc-800 p-3 text-white shadow-xs hover:bg-zinc-600 transition-colors duration-200"
                    onClick={() => setCommandOpen(true)}
                    title="Command Palette"
                >
                    <Bars4Icon aria-hidden="true" className="size-6" />
                </button>
            </div>
            <main id="MAIN" role="main" className="overflow-x-auto overflow-y-hidden py-8 min-h-screen box-border">
                <div
                    //flex track
                    className="flex flex-row gap-4 items-center w-max mx-auto px-16 box-border"
                >
                    {openProjectObjs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full text-gray-400 text-2xl font-medium tracking-wider text-center">
                            Use{" "}
                            <span>
                                <kbd className="bg-neutral-800 py-[0.2em] px-[0.5em] rounded font-semibold">Ctrl</kbd> +{" "}
                                <kbd className="bg-neutral-800 py-[0.2em] px-[0.5em] rounded font-semibold">K</kbd>{" "}
                            </span>
                            to open the command palette
                        </div>
                    ) : (
                        <ProjectDndContext
                            sensors={sensors}
                            collisionDetection={projectClosestCenter}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                        >
                            <ProjectSortableContext
                                items={openedProjects}
                                strategy={projectVerticalListSortingStrategy}
                            >
                                {openProjectObjs.map((project) => (
                                    <SortableProjectCard
                                        key={project.name}
                                        id={project.name}
                                        project={project}
                                        isDropTarget={dropTargetId === project.name}
                                    />
                                ))}
                            </ProjectSortableContext>
                        </ProjectDndContext>
                    )}
                </div>
            </main>
        </>
    );
}

// Sortable wrapper for ProjectCard
function SortableProjectCard({ id, project, isDropTarget }: { id: string; project: Project; isDropTarget?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useProjectSortable({ id });
    // Only use drag handle on a dedicated element, not the whole card
    // Compute transform and transition for pop effect
    let cardTransform = transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined;
    if (isDropTarget) {
        cardTransform = (cardTransform ? cardTransform + " " : "") + "scale(1.02)";
    }
    let cardTransition = transition || undefined;
    if (isDropTarget) {
        cardTransition =
            (cardTransition ? cardTransition + "," : "") +
            " box-shadow 0.18s cubic-bezier(.4,2,.6,1), transform 0.18s cubic-bezier(.4,2,.6,1)";
    }
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: cardTransform,
                transition: cardTransition,
                opacity: isDragging ? 0.5 : 1,
                zIndex: isDragging ? 1000 : undefined,
                borderRadius: isDropTarget ? 12 : undefined,
            }}
            {...attributes}
        >
            <ProjectCard project={project} dragHandleProps={listeners} />
        </div>
    );
}

// Wrap App in SettingsProvider, then DialogProvider, then ProjectsProvider
const AppWithProviders = () => (
    <SettingsProvider>
        <DialogProvider>
            <ProjectsProvider>
                <App />
            </ProjectsProvider>
        </DialogProvider>
    </SettingsProvider>
);

export default AppWithProviders;
