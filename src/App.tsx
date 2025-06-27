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

function App() {
    const { projects, addProject, openedProjects, openProject, closeProject, setOpenedProjects } = useProjects();
    const dialog = useDialog();
    const [commandOpen, setCommandOpen] = useState(false);

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

    function handleCreateProject(initialName?: string) {
        const emptyProject: Project = {
            name: initialName || '',
            logo: '',
            todos: [],
            quickLinks: [],
            iconLinks: [],
        };
        dialog.openDialog(
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
        if (!over || active.id === over.id) return;
        const oldIndex = openedProjects.indexOf(active.id);
        const newIndex = openedProjects.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        setOpenedProjects(projectArrayMove(openedProjects, oldIndex, newIndex));
    }

    return (
        <>
            <CommandPalette open={commandOpen} setOpen={setCommandOpen} onChange={handlePaletteChange} />
            <main
                id="MAIN"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: '2em', overflowX: 'auto', minHeight: '60vh' }}
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
                    <ProjectDndContext sensors={sensors} collisionDetection={projectClosestCenter} onDragEnd={handleDragEnd}>
                        <ProjectSortableContext items={openedProjects} strategy={projectVerticalListSortingStrategy}>
                            {openProjectObjs.map((project, idx) => (
                                <SortableProjectCard key={project.name} id={project.name} project={project} />
                            ))}
                        </ProjectSortableContext>
                    </ProjectDndContext>
                )}
            </main>

        </>
    );
}

// Sortable wrapper for ProjectCard
function SortableProjectCard({ id, project }: { id: string, project: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useProjectSortable({ id });
    // Only use drag handle on a dedicated element, not the whole card
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
                transition,
                opacity: isDragging ? 0.5 : 1,
                zIndex: isDragging ? 1000 : undefined,
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
