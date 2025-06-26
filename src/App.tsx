import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import ProjectCard, { QuickLink } from './ProjectCard';
import { ToDoItem } from './ToDoList';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './EditProjectDialog';
import CommandPalette from './CommandPalette';

function loadProjectFromStorage(defaultProject: any) {
    const key = `project-${defaultProject.name}`;
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {}
    }
    return defaultProject;
}

function loadAllProjectsFromStorage() {
    const projects: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('project-')) {
            try {
                const proj = JSON.parse(localStorage.getItem(key)!);
                projects.push(proj);
            } catch {}
        }
    }
    return projects;
}

function App() {
    const [projects, setProjects] = useState(() => loadAllProjectsFromStorage());
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
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    function handleCreateProject() {
        dialog.openDialog(
            <EditProjectDialog
                title ="Create New Project"
                name="New Project"
                logo=""
                links={[]}
                onSave={(name, logo, links) => {
                    const newProject = {
                        name,
                        logo: logo || '',
                        todos: [],
                        quickLinks: links || [],
                    };
                    localStorage.setItem(`project-${name}`, JSON.stringify(newProject));
                    setProjects(prev => [...prev, newProject]);
                    dialog.closeDialog();
                }}
                onCancel={dialog.closeDialog}
            />
        );
    }

    return (
        <>
            <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
            <main style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: '2em',  }}>
                {projects.map((project, idx) => (
                    <ProjectCard key={project.name} project={project} />
                ))}
            </main>
            {/* FAB for new project */}
            <button
                onClick={handleCreateProject}
                aria-label="Create new project"
                style={{
                    position: 'fixed',
                    left: 32,
                    bottom: 32,
                    zIndex: 30000,
                    background: '#8ec6ff',
                    color: '#23272f',
                    border: 'none',
                    borderRadius: '100%',
                    width: '64px',
                    height: '64px',
                    boxShadow: '0 4px 24px #0006',
                    fontSize: '2.5em',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    outline: 'none',
                    padding: 0,
                    lineHeight: 1,
                }}
            >
                <span style={{display: 'block', width: '100%', textAlign: 'center', lineHeight: 0, marginBottom: '0.5rem',  fontSize: '1em', fontWeight: 700}}>+</span>
            </button>
        </>
    );
}

// Wrap App in DialogProvider
const AppWithDialogProvider = () => (
  <DialogProvider>
    <App />
  </DialogProvider>
);

export default AppWithDialogProvider;
