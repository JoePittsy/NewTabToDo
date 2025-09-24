import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import ProjectCard, { QuickLink } from './ProjectCard';
import { ToDoItem } from './ToDoList';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './Edit Project/EditProjectDialog';
import CommandPalette from './CommandPalette';
import { ProjectsProvider, useProjects, Project, IconLink } from './ProjectsProvider';
import {
    DndContext as ProjectDndContext,
    closestCenter as projectClosestCenter,
    PointerSensor as ProjectPointerSensor,
    useSensor as useProjectSensor,
    useSensors as useProjectSensors,
} from '@dnd-kit/core';
import {
    arrayMove as projectArrayMove,
    SortableContext as ProjectSortableContext,
    useSortable as useProjectSortable,
    verticalListSortingStrategy as projectVerticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SettingsProvider } from './SettingsProvider';
import PlusIcon from '@heroicons/react/20/solid/PlusIcon';
import FireworkEffect from './FireworkEffect';
import { Bars4Icon } from '@heroicons/react/24/outline';

function App() {
    const { projects, addProject, openedProjects, openProject, closeProject, setOpenedProjects } = useProjects();
    const dialog = useDialog();
    const [commandOpen, setCommandOpen] = useState(false);
    // Snap preview state for DnD drop target
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    // Replace single firework state with an array of active fireworks
    const [fireworks, setFireworks] = useState<number[]>([]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCommandOpen(true);
            }
        }
        window.addEventListener('keydown', onKeyDown);
        // Horizontal scroll on wheel for main container
        const main = document.getElementsByTagName('html')[0];
        function onWheel(e: WheelEvent) {
            if (!main) return;
            if (e.deltaY > 0) main.scrollLeft += 100;
            else main.scrollLeft -= 100;
        }
        if (main) main.addEventListener('wheel', onWheel);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            if (main) main.removeEventListener('wheel', onWheel);
        };
    }, []);

    useEffect(() => {
        // On mount, open up to 5 projects with the most uncompleted to-dos
        if (openedProjects.length === 0 && projects.length > 0) {
            // Only consider projects with at least one uncompleted to-do
            const withUncompleted = projects.filter(p => (p.todos?.some((t: any) => !t.completed)));
            // Sort by number of uncompleted to-dos (descending), then by most recent to-do createdOn
            const sorted = [...withUncompleted].sort((a, b) => {
                const aUncompleted = a.todos?.filter((t: any) => !t.completed).length ?? 0;
                const bUncompleted = b.todos?.filter((t: any) => !t.completed).length ?? 0;
                if (bUncompleted !== aUncompleted) return bUncompleted - aUncompleted;
                // If tie, sort by most recent to-do createdOn
                const aLatest = Math.max(...(a.todos?.map((t: any) => t.createdOn || 0) ?? [0]));
                const bLatest = Math.max(...(b.todos?.map((t: any) => t.createdOn || 0) ?? [0]));
                return bLatest - aLatest;
            });
            const top5 = sorted.slice(0, 5).map(p => p.name);
            if (top5.length > 0) setOpenedProjects(top5);
        }
        // Only run when projects change or openedProjects change
    }, [projects]);

    useEffect(() => {
        // Listen for custom event to trigger fireworks globally
        function onFireworkEvent(e: any) {
            setFireworks(fw => [...fw, Date.now() + Math.random()]);
        }
        window.addEventListener('firework', onFireworkEvent);
        return () => window.removeEventListener('firework', onFireworkEvent);
    }, []);

    function handleCreateProject(initialName?: string) {
        const emptyProject: Project = {
            name: initialName || '',
            logo: '',
            todos: [],
            quickLinks: [],
            iconLinks: [],
        };
        dialog.openDialog( () =>
            <EditProjectDialog
                project={emptyProject}
                onSave={proj => {
                    addProject(proj);
                    openProject(proj.name); // Open the new project automatically
                    dialog.closeDialog();
                }}
                onCancel={dialog.closeDialog}
            />
        );
    }

    function handlePaletteChange(item: any) {
        if (item && (item.query || item.query === '')) {
            setCommandOpen(false);
            setTimeout(() => handleCreateProject(item.query), 0);
        } else if (item && item.url) {
            window.location = item.url;
        }
    }

    // DnD for open projects
    const sensors = useProjectSensors(useProjectSensor(ProjectPointerSensor));
    const openProjectObjs = openedProjects
        .map(name => projects.find(p => p.name === name))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
    function handleDragEnd(event: any) {
        const { active, over } = event;
        setDropTargetId(null); // Clear snap preview
        if (!over || active.id === over.id) return;
        const oldIndex = openedProjects.indexOf(active.id);
        const newIndex = openedProjects.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        setOpenedProjects(projectArrayMove(openedProjects, oldIndex, newIndex));
    }
    function handleDragOver(event: any) {
        const { over } = event;
        setDropTargetId(over?.id ?? null);
    }

    return (
        <>
            {fireworks.map(id => (
                <FireworkEffect key={id} trigger={true} onDone={() => setFireworks(fw => fw.filter(f => f !== id))} multiple={8} />
            ))}
            <CommandPalette open={commandOpen} setOpen={setCommandOpen} onChange={handlePaletteChange} />
            {/* Top-right buttons */}

            <div className="fixed top-4 right-4 z-[10010] flex gap-2">
                <button
                    type="button"
                    className="cursor-pointer rounded-full bg-slate-600 p-3 text-white shadow-xs hover:bg-slate-800 transition-colors duration-200"
                    onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = '.json';
                        fileInput.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const projectData = JSON.parse(event.target?.result as string);
                                        addProject(projectData);
                                    } catch (error) {
                                        console.error('Error parsing project file:', error);
                                        alert('Invalid project file format');
                                    }
                                };
                                reader.readAsText(file);
                            }
                        };
                        fileInput.click();
                    }}
                    title="Import Project"
                >
                    📥
                </button>
                <button
                    type="button"
                    className="cursor-pointer rounded-full bg-slate-600 p-3 text-white shadow-xs hover:bg-slate-800 transition-colors duration-200"
                    onClick={() => setCommandOpen(true)}
                    title="Command Palette"
                >
                    <Bars4Icon aria-hidden="true" className="size-6" />
                </button>
            </div>
            <main
                // id="MAIN"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', overflowX: 'auto' }}
            >
                {openProjectObjs.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        minHeight: '50vh',
                        color: '#aaa',
                        fontSize: '1.5rem',
                        fontWeight: 500,
                        letterSpacing: 0.2,
                        textAlign: 'center',
                    }}>
                        Use <span><kbd style={{ background: '#222', padding: '0.2em 0.5em', borderRadius: '4px', fontWeight: 600 }}>Ctrl</kbd> + <kbd style={{ background: '#222', padding: '0.2em 0.5em', borderRadius: '4px', fontWeight: 600 }}>K</kbd> </span>to open the command palette
                    </div>
                ) : (
                    <ProjectDndContext sensors={sensors} collisionDetection={projectClosestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
                        <ProjectSortableContext items={openedProjects} strategy={projectVerticalListSortingStrategy}>
                            {openProjectObjs.map((project, idx) => (
                                <SortableProjectCard key={project.name} id={project.name} project={project} isDropTarget={dropTargetId === project.name} />
                            ))}
                        </ProjectSortableContext>
                    </ProjectDndContext>
                )}
            </main>

        </>
    );
}

// Sortable wrapper for ProjectCard
function SortableProjectCard({ id, project, isDropTarget }: { id: string, project: any, isDropTarget?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useProjectSortable({ id });
    // Only use drag handle on a dedicated element, not the whole card
    // Compute transform and transition for pop effect
    let cardTransform = transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined;
    if (isDropTarget) {
        cardTransform = (cardTransform ? cardTransform + ' ' : '') + 'scale(1.02)';
    }
    let cardTransition = transition || undefined;
    if (isDropTarget) {
        cardTransition = (cardTransition ? cardTransition + ',' : '') + ' box-shadow 0.18s cubic-bezier(.4,2,.6,1), transform 0.18s cubic-bezier(.4,2,.6,1)';
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
