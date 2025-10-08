import React from "react";
import LinkRow from "./LinkRow";
import { QuickLink } from "@/components/ProjectCard/ProjectCard";

interface LinksEditorProps {
    links: QuickLink[];
    parentPath?: number[];
    updateLink: (path: number[], newLink: QuickLink) => void;
    deleteLink: (path: number[]) => void;
    addLink: (path: number[]) => void;
    addRootLink?: () => void;
}

function LinksEditor({ links, parentPath, updateLink, deleteLink, addLink, addRootLink }: LinksEditorProps) {
    return (
        <div style={{ marginLeft: parentPath?.length ? 10 : 0, marginTop: 0, marginBottom: 0 }}>
            {links.map((link, idx) => (
                <React.Fragment key={link.label + idx}>
                    <LinkRow
                        link={link}
                        idx={idx}
                        parentPath={parentPath ?? []}
                        updateLink={updateLink}
                        deleteLink={deleteLink}
                        addLink={addLink}
                    />
                    <LinksEditor
                        links={link.children || []}
                        parentPath={[...(parentPath ?? []), idx]}
                        updateLink={updateLink}
                        deleteLink={deleteLink}
                        addLink={addLink}
                    />
                </React.Fragment>
            ))}
            {!parentPath && addRootLink && (
                <button
                    type="button"
                    onClick={() => addRootLink()}
                    className="text-sky-300 bg-transparent font-semibold text-sm cursor-pointer mt-0.5 p-0 block"
                >
                    + Add Folder or Link
                </button>
            )}
        </div>
    );
}

export default LinksEditor;
