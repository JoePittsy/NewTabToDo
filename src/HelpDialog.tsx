import React, { useState } from "react";
import DialogHeader from "./DialogHeader";

const TABS = [
    { label: "General", key: "general" },
    { label: "Shortcuts", key: "shortcuts" },
    { label: "Projects", key: "projects" },
    { label: "To-Dos", key: "todos" },
    { label: "Links", key: "links" },
    { label: "Broken SSO", key: "sso" },
];

const HelpDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [tab, setTab] = useState("general");

    return (
        <div className="relative min-h-80 ">
            <DialogHeader title="Help" tabs={TABS} activeTab={tab} setActiveTab={setTab} onClose={onClose} />
            <div className="text-xl">
                {tab === "general" && (
                    <>
                        <p className="mb-2">
                            <b>Project Manager App</b>
                        </p>
                        <p className="mb-2">Manage your projects, to-dos, and quick links efficiently.</p>
                        <p className="mb-0">Use the tabs above to learn more about each feature.</p>
                    </>
                )}
                {tab === "shortcuts" && (
                    <ul className="my-4 pl-5 list-disc">
                        <li>
                            <b>Ctrl+K</b> or <b>Cmd+K</b>: Open Command Palette
                        </li>
                        <li>
                            <b>Tab/Shift+Tab</b>: Navigate palette options
                        </li>
                        <li>
                            <b>Enter</b>: Select highlighted option
                        </li>
                    </ul>
                )}
                {tab === "projects" && (
                    <ul className="my-4 pl-5 list-disc">
                        <li>Create, open, and manage projects</li>
                        <li>Drag to reorder open projects</li>
                        <li>Edit or delete projects from the project card menu</li>
                    </ul>
                )}
                {tab === "todos" && (
                    <ul className="my-4 pl-5 list-disc">
                        <li>Add, complete, and reorder to-dos</li>
                        <li>Click a to-do to mark as complete</li>
                        <li>Drag to-dos to change their order</li>
                    </ul>
                )}
                {tab === "links" && (
                    <ul className="my-4 pl-5 list-disc">
                        <li>Add quick links to projects</li>
                        <li>Organize links in folders</li>
                        <li>Click a link to open it in a new tab</li>
                    </ul>
                )}
                {tab === "sso" && (
                    <div>
                        <b>Broken SSO</b>
                        <br />
                        <span className="text-base">
                            If you can't login using the container you'll have to enable SSO using a Firefox config.
                            <br />
                            Go to <code className="bg-gray-800 rounded-md px-1">about:profiles</code> and open the Root
                            Directory for the default profile.
                            <br />
                            Find and open the <code className="bg-gray-800 rounded-md px-1">containers.json</code> file,
                            then make a note of the relevant container's ID (<b>userContextId</b>).
                            <br />
                            Finally go to <code className="bg-gray-800 rounded-md px-1">about:config</code> and set{" "}
                            <code className="bg-gray-800 rounded-md px-1">
                                network.http.windows-sso.container-enabled.CONTAINER_ID
                            </code>{" "}
                            to <b>true</b>.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpDialog;
