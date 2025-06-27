import React from 'react';
import LinkRow from './LinkRow';

interface LinksEditorProps {
  links: any[];
  parentPath?: number[];
  updateLink: (path: number[], newLink: any) => void;
  deleteLink: (path: number[]) => void;
  addLink: (path: number[]) => void;
  addRootLink?: () => void;
}

function LinksEditor({ links, parentPath, updateLink, deleteLink, addLink, addRootLink }: LinksEditorProps) {
  return (
    <div style={{ marginLeft: parentPath?.length ? 10 : 0, marginTop: 0, marginBottom: 0 }}>
      {links.map((link, idx) => (
        <React.Fragment key={link.id}>
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
          style={{
            color: '#8ec6ff',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.98em',
            cursor: 'pointer',
            marginTop: 2,
            padding: 0,
            display: 'block'
          }}
        >
          + Add Folder or Link
        </button>
      )}
    </div>
  );
}

export default LinksEditor;
