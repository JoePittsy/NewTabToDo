import React, { useEffect, useState } from 'react';
import DialogHeader from './DialogHeader';
import { getSettings, putSettings } from './idb';

interface SettingsDialogProps {
    onClose: () => void;
}

const tabList = [
    { key: 'general', label: 'General' },
    { key: 'advanced', label: 'Advanced' },
];

interface GeneralSettings {
    useFirefoxContainers: boolean;

}

export interface Settings {
    General: GeneralSettings
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<string>('general');
    const [settings, setSettings] = useState<Settings>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getSettings().then(s => {
            setSettings(s);
            setLoading(false)
        })
    }, []);

    const onSave = () => {
        if (!settings === undefined) onClose();
        else {
            putSettings(settings as Settings).then(() => {
                onClose();
            })
        }
    }

    if (loading) return <></>;

    return (
        <div style={{ width: 480, minHeight: 340, background: '#23272f', borderRadius: 12, color: '#f3f6fa', position: 'relative' }}>
            <DialogHeader title='Settings' tabs={tabList} activeTab={activeTab} setActiveTab={setActiveTab} onClose={onClose} />

            <div style={{ minHeight: 180, marginBottom: 24 }}>
                {activeTab === 'general' && (
                    <div>
                        <h3 style={{ color: '#b8c7e0', fontWeight: 600, fontSize: '1.1em' }}>General Settings</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.2em 0 0.7em 0', fontSize: '1.05em', color: '#f3f6fa' }}>
                            <input
                                type="checkbox"
                                checked={settings!.General.useFirefoxContainers}
                                onChange={e => setSettings(s => s ? { ...s, General: { ...s.General, useFirefoxContainers: e.target.checked } } : s)}
                                style={{ width: 18, height: 18, accentColor: '#8ec6ff' }}
                                aria-label="Use Firefox Containers"
                            />
                            Use Firefox Containers
                        </label>
                        <div style={{ color: '#b8c7e0', fontSize: '0.98em', marginLeft: 28, marginBottom: 8 }}>
                            When enabled, links will open in a container named after the project. Firefox and the <a href="https://addons.mozilla.org/en-US/firefox/addon/open-url-in-container/">Open external links in a container</a> exstention are required.
                        </div>
                        <p style={{ color: '#b8c7e0' }}>Coming soon: global app settings, keyboard shortcuts, and more.</p>
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div>
                        <h3 style={{ color: '#b8c7e0', fontWeight: 600, fontSize: '1.1em' }}>Advanced</h3>
                        <p style={{ color: '#b8c7e0' }}>Coming soon: data export/import, reset, and developer options.</p>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: '1em', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button type="button" onClick={onSave} style={{ background: 'none', color: '#8ec6ff', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6 }}>Save Settings</button>
            </div>
        </div>
    );
};

export default SettingsDialog;
