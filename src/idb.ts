import { Project } from "./ProjectsProvider";
import { Settings } from "./SettingsDialog";

const DB_NAME = "project_manager";
const PROJECTS_STORE_NAME = "projects";
const SETTINGS_STORE_NAME = "settings";
const DB_VERSION = 2;

const defaultSettings: Settings = {
    General: {
        useFirefoxContainers: false,
    },
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
                db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: "name" });
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                const settingsStore = db.createObjectStore(SETTINGS_STORE_NAME);
                settingsStore.put(defaultSettings, SETTINGS_STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getSettings(): Promise<Settings> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE_NAME, "readonly");
        const store = tx.objectStore(SETTINGS_STORE_NAME);
        const req = store.get(SETTINGS_STORE_NAME);
        req.onsuccess = () => resolve(req.result as Settings);
        req.onerror = () => reject(req.error);
    });
}

export async function putSettings(settings: Settings): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE_NAME, "readwrite");
        const store = tx.objectStore(SETTINGS_STORE_NAME);
        const req = store.put(settings, SETTINGS_STORE_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function getAllProjects(): Promise<Project[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE_NAME, "readonly");
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Project[]);
        req.onerror = () => reject(req.error);
    });
}

export async function putProject(project: Project): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE_NAME, "readwrite");
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function deleteProjectByName(name: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE_NAME, "readwrite");
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        const req = store.delete(name);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function exportAllData(): Promise<{ projects: Project[]; settings: Settings }> {
    const [projects, settings] = await Promise.all([getAllProjects(), getSettings()]);
    return { projects, settings };
}

export async function importAllData(data: { projects: Project[]; settings: Settings }): Promise<void> {
    const db = await openDB();
    // Clear both stores, then add new data
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([PROJECTS_STORE_NAME, SETTINGS_STORE_NAME], "readwrite");
        tx.objectStore(PROJECTS_STORE_NAME).clear();
        tx.objectStore(SETTINGS_STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    // Add projects
    for (const project of data.projects) {
        await putProject(project);
    }
    // Add settings
    await putSettings(data.settings);
}
