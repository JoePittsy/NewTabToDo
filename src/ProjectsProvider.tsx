import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllProjects, putProject, deleteProjectByName, IDBProject } from './idb';

export interface Project {
    name: string;
    logo: string;
    todos: any[];
    quickLinks: any[];
}

interface ProjectsContextType {
    projects: Project[];
    addProject: (project: Project) => void;
    updateProject: (name: string, updates: Partial<Project>) => void;
    deleteProject: (name: string) => void;
    reloadProjects: () => void;
    openedProjects: string[];
    openProject: (name: string) => void;
    closeProject: (name: string) => void;
    setOpenedProjects: (names: string[]) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

async function loadAllProjectsFromIDB(): Promise<Project[]> {
    return await getAllProjects();
}

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [openedProjects, setOpenedProjects] = useState<string[]>([]);

    const reloadProjects = useCallback(() => {
        loadAllProjectsFromIDB().then(setProjects);
    }, []);

    useEffect(() => {
        reloadProjects();
    }, [reloadProjects]);

    const addProject = useCallback((project: Project) => {
        putProject(project).then(() => reloadProjects());
    }, [reloadProjects]);

    const updateProject = useCallback((name: string, updates: Partial<Project>) => {
        const proj = projects.find(p => p.name === name);
        if (!proj) return;
        const updated = { ...proj, ...updates };
        putProject(updated).then(() => reloadProjects());
    }, [projects, reloadProjects]);

    const deleteProject = useCallback((name: string) => {
        deleteProjectByName(name).then(() => reloadProjects());
        setOpenedProjects(prev => prev.filter(n => n !== name));
    }, [reloadProjects]);

    const openProject = useCallback((name: string) => {
        setOpenedProjects(prev => prev.includes(name) ? prev : [...prev, name]);
    }, []);

    const closeProject = useCallback((name: string) => {
        setOpenedProjects(prev => prev.filter(n => n !== name));
    }, []);

    return (
        <ProjectsContext.Provider value={{ projects, addProject, updateProject, deleteProject, reloadProjects, openedProjects, openProject, closeProject, setOpenedProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
};

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error('useProjects must be used within a ProjectsProvider');
    return ctx;
}
