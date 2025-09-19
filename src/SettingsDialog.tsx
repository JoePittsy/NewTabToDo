import React, { useState, useEffect } from "react";
import DialogHeader from "./DialogHeader";
import { useSettings, useUpdateSettings } from "./SettingsProvider";
import { exportAllData, importAllData } from "./idb";
import { DropboxBackupService } from "./cloud/DropboxBackupService";
import RestoreDialog from "./cloud/RestoreDialog";
import { useDialog } from "./DialogProvider";

interface SettingsDialogProps {
  onClose: () => void;
}

const tabList = [
  { key: "general", label: "General" },
  { key: "advanced", label: "Advanced" },
];

interface GeneralSettings {
  useFirefoxContainers: boolean;
  showFireworks?: boolean;
}

export interface Settings {
  General: GeneralSettings;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("general");
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const [draft, setDraft] = useState<Settings | undefined>(settings);

  const dialog = useDialog();
  const [providerConnections, setProviderConnections] = useState<
    Record<string, boolean>
  >({});
  const providers = [
    { key: "dropbox", name: "Dropbox", service: DropboxBackupService },
  ];

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Set default for showFireworks if not present
  useEffect(() => {
    if (
      settings &&
      settings.General &&
      settings.General.showFireworks === undefined
    ) {
      setDraft((s) =>
        s ? { ...s, General: { ...s.General, showFireworks: true } } : s
      );
    }
  }, [settings]);

  useEffect(() => {}, []);

  const handleDropboxConnect = async () => {
    try {
      const svc = new DropboxBackupService();
      await svc.authenticate();
    } catch (err) {
      alert(
        "Failed to connect Dropbox: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleDropboxDisconnect = () => {
    const svc = new DropboxBackupService();
    svc.disconnect();
  };

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
    a.download = `project_manager_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
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
      if (!data.projects || !data.settings)
        throw new Error("Invalid backup file");
      await importAllData(data);
      window.location.reload();
    } catch (err) {
      alert(
        "Failed to import: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleCloudBackup = async () => {
    try {
      const svc = new DropboxBackupService();
      await svc.authenticate();
      const data = await exportAllData();
      const filename = `project_manager_backup_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      await svc.uploadBackup(data, filename);
      alert("Backup uploaded to Dropbox as " + filename);
    } catch (err) {
      alert(
        "Dropbox backup failed: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleCloudRestore = async () => {
    try {
      const svc = new DropboxBackupService();
      await svc.authenticate();
      const files = await svc.listBackups();
      if (files.length === 0) return alert("No backups in Dropbox");

      dialog.openDialog(() => (
        <RestoreDialog
          backups={files}
          onCancel={dialog.closeDialog}
          onConfirm={confirmRestore}
          open={true}
        />
      ));
    } catch (err) {
      alert(
        "Dropbox restore failed: " +
          (err instanceof Error ? err.message : String(err))
      );
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
      alert(
        "Dropbox restore failed: " +
          (err instanceof Error ? err.message : String(err))
      );
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

  const handleProviderConnect = async (key: string, ServiceClass: any) => {
    try {
      const svc = new ServiceClass();
      await svc.authenticate();
      setProviderConnections((c) => ({ ...c, [key]: true }));
    } catch (err) {
      alert(
        "Failed to connect " +
          key +
          ": " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleProviderDisconnect = (key: string, ServiceClass: any) => {
    const svc = new ServiceClass();
    svc.disconnect();
    setProviderConnections((c) => ({ ...c, [key]: false }));
  };

  if (!draft) return <></>;

  return (
    <div
      style={{
        width: 480,
        minHeight: 340,
        background: "#23272f",
        borderRadius: 12,
        color: "#f3f6fa",
        position: "relative",
      }}
    >
      <DialogHeader
        title="Settings"
        tabs={tabList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      <div style={{ minHeight: 180, marginBottom: 24 }}>
        {activeTab === "general" && (
          <div>
            <h3
              style={{ color: "#b8c7e0", fontWeight: 600, fontSize: "1.1em" }}
            >
              General Settings
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
                checked={draft.General.useFirefoxContainers}
                onChange={(e) =>
                  setDraft((s) =>
                    s
                      ? {
                          ...s,
                          General: {
                            ...s.General,
                            useFirefoxContainers: e.target.checked,
                          },
                        }
                      : s
                  )
                }
                style={{ width: 18, height: 18, accentColor: "#8ec6ff" }}
                aria-label="Use Firefox Containers"
              />
              Use Firefox Containers
            </label>
            <div
              style={{
                color: "#b8c7e0",
                fontSize: "0.98em",
                marginLeft: 28,
                marginBottom: 8,
              }}
            >
              When enabled, links will open in a container named after the
              project. Firefox and the{" "}
              <a href="https://addons.mozilla.org/en-US/firefox/addon/open-url-in-container/">
                Open external links in a container
              </a>{" "}
              exstention are required.
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "0.7em 0 0.7em 0",
                fontSize: "1.05em",
                color: "#f3f6fa",
              }}
            >
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
                style={{ width: 18, height: 18, accentColor: "#8ec6ff" }}
                aria-label="Show fireworks when completing to-dos"
              />
              Show fireworks when completing to-dos
            </label>
          </div>
        )}

        {activeTab === "advanced" && (
          <div>
            <h3
              style={{ color: "#b8c7e0", fontWeight: 600, fontSize: "1.1em" }}
            >
              Advanced
            </h3>
            <p style={{ color: "#b8c7e0" }}>
              Export or import your entire configuration (projects and
              settings).
            </p>
            <div style={{ display: "flex", gap: 16, margin: "1em 0" }}>
              <button
                type="button"
                onClick={handleExport}
                style={{
                  background: "#23272f",
                  color: "#8ec6ff",
                  border: "1px solid #8ec6ff",
                  fontWeight: 600,
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "0.5em 1.2em",
                  borderRadius: 6,
                }}
              >
                Export
              </button>
              <label
                style={{
                  background: "#23272f",
                  color: "#8ec6ff",
                  border: "1px solid #8ec6ff",
                  fontWeight: 600,
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "0.5em 1.2em",
                  borderRadius: 6,
                }}
              >
                Import
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div style={{ marginTop: "1.5em" }}>
            <h3
              style={{ color: "#b8c7e0", fontWeight: 600, fontSize: "1.1em" }}
            >
              Cloud Backup (Dropbox)
            </h3>
            <p style={{ color: "#b8c7e0" }}>
              Manage cloud backups by connecting your account.
            </p>
            {providers.map((p) => (
              <div
                key={p.key}
                style={{ display: "flex", gap: 16, margin: "1em 0" }}
              >
                {!providerConnections[p.key] && (
                  <button
                    type="button"
                    onClick={() => handleProviderConnect(p.key, p.service)}
                    style={{
                      background: "#23272f",
                      color: "#8ec6ff",
                      border: "1px solid #8ec6ff",
                      fontWeight: 600,
                      fontSize: "1em",
                      cursor: "pointer",
                      padding: "0.5em 1.2em",
                      borderRadius: 6,
                    }}
                  >
                    Connect to {p.name}
                  </button>
                )}
                {providerConnections[p.key] && (
                  <>
                    <button
                      type="button"
                      onClick={handleCloudBackup}
                      style={{
                        background: "#23272f",
                        color: "#8ec6ff",
                        border: "1px solid #8ec6ff",
                        fontWeight: 600,
                        fontSize: "1em",
                        cursor: "pointer",
                        padding: "0.5em 1.2em",
                        borderRadius: 6,
                      }}
                    >
                      Backup to {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloudRestore}
                      style={{
                        background: "#23272f",
                        color: "#8ec6ff",
                        border: "1px solid #8ec6ff",
                        fontWeight: 600,
                        fontSize: "1em",
                        cursor: "pointer",
                        padding: "0.5em 1.2em",
                        borderRadius: 6,
                      }}
                    >
                      Restore from {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderDisconnect(p.key, p.service)}
                      style={{
                        background: "transparent",
                        color: "#f87171",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "1.2em",
                        cursor: "pointer",
                        padding: "0.2em 0.6em",
                        borderRadius: 6,
                      }}
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
      </div>
      <div
        style={{
          display: "flex",
          gap: "1em",
          justifyContent: "flex-end",
          marginTop: "auto",
        }}
      >
        <button
          type="button"
          onClick={onSave}
          style={{
            background: "none",
            color: "#8ec6ff",
            border: "none",
            fontWeight: 600,
            fontSize: "1em",
            cursor: "pointer",
            padding: "0.5em 1.2em",
            borderRadius: 6,
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsDialog;
