import { DropboxBackupService } from "@/cloud/DropboxBackupService";
import { useSettings, useUpdateSettings } from "@/SettingsProvider";
import { exportAllData, importAllData } from "@/idb";
import React, { useState, useEffect } from "react";
import RestoreDialog from "@/cloud/RestoreDialog";
import { useDialog } from "@/useDialog";
import DialogHeader from "@/DialogHeader";
import { Settings} from "@/Interfaces";

interface SettingsDialogProps {
    onClose: () => void;
}

const tabList = [
    { key: "general", label: "General" },
    { key: "advanced", label: "Advanced" },
    { key: "background", label: "Background" }
];


const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<string>("general");
    const settings = useSettings();
    const updateSettings = useUpdateSettings();
    const [draft, setDraft] = useState<Settings | undefined>(settings);

    const dialog = useDialog();
    const [providerConnections, setProviderConnections] = useState<Record<string, boolean>>({});
    const providers = [{ key: "dropbox", name: "Dropbox", service: DropboxBackupService }];

    useEffect(() => {
        setDraft(settings);
    }, [settings]);

    // Set default for showFireworks if not present
    useEffect(() => {
        if (settings && settings.General && settings.General.showFireworks === undefined) {
            setDraft((s) => (s ? { ...s, General: { ...s.General, showFireworks: true } } : s));
        }
    }, [settings]);

    useEffect(() => {}, []);

    const onSave = async () => {
        if (!draft) return onClose();
        await updateSettings(draft);
        onClose();
    };

    const handleExport = async () => {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `project_manager_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.projects || !data.settings) throw new Error("Invalid backup file");
            await importAllData(data);
            window.location.reload();
        } catch (err) {
            alert("Failed to import: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleCloudBackup = async () => {
        try {
            const svc = new DropboxBackupService();
            await svc.authenticate();
            const data = await exportAllData();
            const filename = `project_manager_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
            await svc.uploadBackup(data, filename);
            alert("Backup uploaded to Dropbox as " + filename);
        } catch (err) {
            alert("Dropbox backup failed: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleCloudRestore = async () => {
        try {
            const svc = new DropboxBackupService();
            await svc.authenticate();
            const files = await svc.listBackups();
            if (files.length === 0) return alert("No backups in Dropbox");

            dialog.openDialog(() => (
                <RestoreDialog backups={files} onCancel={dialog.closeDialog} onConfirm={confirmRestore} open={true} />
            ));
        } catch (err) {
            alert("Dropbox restore failed: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const confirmRestore = async (selectedBackup: string) => {
        try {
            const svc = new DropboxBackupService();
            await svc.authenticate();
            const data = await svc.downloadBackup(selectedBackup);
            await importAllData(data);
            window.location.reload();
        } catch (err) {
            alert("Dropbox restore failed: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    useEffect(() => {
        const connections: Record<string, boolean> = {};
        providers.forEach((p) => {
            const svc = new p.service();
            connections[p.key] = svc.isConnected();
        });
        setProviderConnections(connections);
    }, []);

    const handleProviderConnect = async (key: string, ServiceClass: typeof DropboxBackupService) => {
        try {
            const svc = new ServiceClass();
            await svc.authenticate();
            setProviderConnections((c) => ({ ...c, [key]: true }));
        } catch (err) {
            alert("Failed to connect " + key + ": " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleProviderDisconnect = (key: string, ServiceClass: typeof DropboxBackupService) => {
        const svc = new ServiceClass();
        svc.disconnect();
        setProviderConnections((c) => ({ ...c, [key]: false }));
    };

    if (!draft) return <></>;

    return (
        <div className="w-[480px] min-h-[336px]  rounded-xl text-zinc-100 relative">
            <DialogHeader
                title="Settings"
                tabs={tabList}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={onClose}
            />

            <div className="min-h-[180px] mb-6">
                {activeTab === "general" && (
                    <div>
                        <h3 className="text-indigo-200 font-semibold text-base">General Settings</h3>
                        <label className="flex items-center gap-2.5 mt-5 mb-3 text-base text-zinc-100">
                            <input
                                type="checkbox"
                                checked={draft.General.useFirefoxContainers}
                                onChange={(e) =>
                                    setDraft((s) =>
                                        s
                                            ? {
                                                  ...s,
                                                  General: { ...s.General, useFirefoxContainers: e.target.checked },
                                              }
                                            : s
                                    )
                                }
                                className="w-[18px] h-[18px] accent-sky-300"
                                aria-label="Use Firefox Containers"
                            />
                            Use Firefox Containers
                        </label>
                        <div className="text-indigo-200 text-sm ml-7 mb-2">
                            When enabled, links will open in a container named after the project. Firefox and the{" "}
                            <a href="https://addons.mozilla.org/en-US/firefox/addon/open-url-in-container/">
                                Open external links in a container
                            </a>{" "}
                            exstention are required.
                        </div>
                        <label className="flex items-center gap-2.5 my-3 text-base text-zinc-100">
                            <input
                                type="checkbox"
                                checked={draft.General.showFireworks !== false}
                                onChange={(e) =>
                                    setDraft((s) =>
                                        s
                                            ? {
                                                  ...s,
                                                  General: {
                                                      ...s.General,
                                                      showFireworks: e.target.checked,
                                                  },
                                              }
                                            : s
                                    )
                                }
                                className="w-[18px] h-[18px] accent-sky-300"
                                aria-label="Show fireworks when completing to-dos"
                            />
                            Show fireworks when completing to-dos
                        </label>
                    </div>
                )}

                {activeTab === "advanced" && (
                    <div>
                        <h3 className="text-indigo-200 font-semibold text-lg">Advanced</h3>
                        <p className="text-indigo-200">
                            Export or import your entire configuration (projects and settings).
                        </p>
                        <div className="flex gap-4 my-4">
                            <button
                                type="button"
                                onClick={handleExport}
                                className="bg-zinc-900 text-sky-300 border border-sky-300 font-semibold text-base cursor-pointer py-2 px-5 rounded-md"
                            >
                                Export
                            </button>
                            <label className="bg-zinc-900 text-sky-300 border border-sky-300 font-semibold text-base cursor-pointer py-2 px-5 rounded-md">
                                Import
                                <input
                                    type="file"
                                    accept="application/json"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {activeTab === "advanced" && (
                    <div className="mt-6">
                        <h3 className="text-indigo-200 font-semibold text-lg">Cloud Backup (Dropbox)</h3>
                        <p className="text-indigo-200">Manage cloud backups by connecting your account.</p>
                        {providers.map((p) => (
                            <div key={p.key} className="flex gap-4 my-4">
                                {!providerConnections[p.key] && (
                                    <button
                                        type="button"
                                        onClick={() => handleProviderConnect(p.key, p.service)}
                                        className="bg-zinc-900 text-sky-300 border border-sky-300 font-semibold text-base cursor-pointer px-5 py-2 rounded-md"
                                    >
                                        Connect to {p.name}
                                    </button>
                                )}
                                {providerConnections[p.key] && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleCloudBackup}
                                            className="bg-zinc-900 text-sky-300 border border-sky-300 font-semibold text-base cursor-pointer py-2 px-5 rounded-md"
                                        >
                                            Backup to {p.name}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloudRestore}
                                            className="bg-zinc-900 text-sky-300 border border-sky-300 font-semibold text-base cursor-pointer py-2 px-5 rounded-md"
                                        >
                                            Restore from {p.name}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleProviderDisconnect(p.key, p.service)}
                                            className="bg-transparent text-red-400 border-none font-semibold text-lg cursor-pointer py-1 px-2 rounded-md"
                                            title={`Disconnect ${p.name}`}
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "background" && (
                    <div>
                        <h3
                            style={{ color: "#b8c7e0", fontWeight: 600, fontSize: "1.1em" }}
                        >
                            Background Settings
                        </h3>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                margin: "1.2em 0 0.7em 0",
                                fontSize: "1.05em",
                                color: "#f3f6fa",
                            }}
                        >
                            <input
                                type="checkbox"
                                //change this to 
                                checked={draft.Background?.useSpinningBackground}
                                onChange={(e) =>
                                    setDraft((s) =>
                                        s


                                            ? {


                                                ...s,


                                                Background: {


                                                    ...s.Background,


                                                    useSpinningBackground: e.target.checked,
                                                },
                                            }
                                            : s
                                    )
                                }
                                style={{ width: 18, height: 18, accentColor: "#8ec6ff" }}
                                aria-label="Use Spinning Background"
                            />
                            Use Spinning Background
                        </label>
                        <div
                            style={{
                                color: "#b8c7e0",
                                fontSize: "0.98em",
                                marginLeft: 28,
                                marginBottom: 8,
                            }}
                        >
                            When enabled, a colorful spinning background will be displayed.
                        </div>
                        {/* If spinning background is enabled, we should allow background colors settings */}

                    </div>
                )}
            </div>

            <div className="flex gap-4 justify-end mt-auto">
                <button
                    type="button"
                    onClick={onSave}
                    className="bg-transparent text-sky-300 border-none font-semibold text-base cursor-pointer py-2 px-5 rounded-md"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default SettingsDialog;
