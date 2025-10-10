import { Label } from '@headlessui/react';
import React, { useState } from 'react';
import DialogHeader from './DialogHeader';

const TABS = [
    { label: 'General', key: 'general' },
    { label: 'Shortcuts', key: 'shortcuts' },
    { label: 'Projects', key: 'projects' },
    { label: 'To-Dos', key: 'todos' },
    { label: 'Links', key: 'links' },
    { label: 'Broken SSO', key: 'sso' },
];

const HelpDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [tab, setTab] = useState('general');

    return (
        <div >
           <DialogHeader title='Help' tabs={TABS} activeTab={tab} setActiveTab={setTab} onClose={null}  />
            <div style={{  fontSize: '1.13em', marginBottom: 18, minHeight: 120, lineHeight: 1.7 }}>
                {tab === 'general' && (
                    <>
                        <p style={{ marginBottom: 8 }}><b>Project Manager App</b></p>
                        <p style={{ marginBottom: 8 }}>Manage your projects, to-dos, and quick links efficiently.</p>
                        <p style={{ marginBottom: 0 }}>Use the tabs above to learn more about each feature.</p>
                    </>
                )}
                {tab === 'shortcuts' && (
                    <ul style={{ margin: '1em 0', paddingLeft: 22, listStyle: 'disc' }}>
                        <li><b>Ctrl+K</b> or <b>Cmd+K</b>: Open Command Palette</li>
                        <li><b>Tab/Shift+Tab</b>: Navigate palette options</li>
                        <li><b>Enter</b>: Select highlighted option</li>
                    </ul>
                )}
                {tab === 'projects' && (
                    <ul style={{ margin: '1em 0', paddingLeft: 22, listStyle: 'disc' }}>
                        <li>Create, open, and manage projects</li>
                        <li>Drag to reorder open projects</li>
                        <li>Edit or delete projects from the project card menu</li>
                    </ul>
                )}
                {tab === 'todos' && (
                    <ul style={{ margin: '1em 0', paddingLeft: 22, listStyle: 'disc' }}>
                        <li>Add, complete, and reorder to-dos</li>
                        <li>Click a to-do to mark as complete</li>
                        <li>Drag to-dos to change their order</li>
                    </ul>
                )}
                {tab === 'links' && (
                    <ul style={{ margin: '1em 0', paddingLeft: 22, listStyle: 'disc' }}>
                        <li>Add quick links to projects</li>
                        <li>Organize links in folders</li>
                        <li>Click a link to open it in a new tab</li>
                    </ul>
                )}
                {tab === 'sso' && (
                    <div style={{ background: '#181b20', borderRadius: 8, padding: '1em 1.2em', border: '1px solid #333', color: '#e0e0e0' }}>
                        <b>Broken SSO</b><br />
                        <span style={{ fontSize: '0.98em' }}>
                            If you can't login using the container you'll have to enable SSO using a Firefox config.<br />
                            Go to <code style={{ background: '#222', borderRadius: 4, padding: '0 4px' }}>about:profiles</code> and open the Root Directory for the default profile.<br />
                            Find and open the <code style={{ background: '#222', borderRadius: 4, padding: '0 4px' }}>containers.json</code> file, then make a note of the relevant container's ID (<b>userContextId</b>).<br />
                            Finally go to <code style={{ background: '#222', borderRadius: 4, padding: '0 4px' }}>about:config</code> and set <code style={{ background: '#222', borderRadius: 4, padding: '0 4px' }}>network.http.windows-sso.container-enabled.CONTAINER_ID</code> to <b>true</b>.
                        </span>
                    </div>
                )}
            </div>

        </div>
    );
};

export default HelpDialog;
