import React, { useState } from 'react';

interface EditProjectDialogProps {
  title: string;
  name: string;
  logo: string;
  links?: any[];
  onSave: (name: string, logo: string, links: any[]) => void;
  onCancel: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ name: initialName, logo: initialLogo, title, links: initialLinks = [], onSave, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState(initialLogo);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [links, setLinks] = useState<any[]>(initialLinks);
  // Add a state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 1. Helper to generate unique IDs
  function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // 2. When initializing links, ensure all have an id
  function ensureIds(links: any[]): any[] {
    return links.map(link => ({
      ...link,
      id: link.id || generateId(),
      children: link.children ? ensureIds(link.children) : [],
    }));
  }

  // Only run on mount, not on every render
  React.useEffect(() => {
    setLinks(ensureIds(initialLinks));
    // eslint-disable-next-line
  }, []);

  function updateLink(path: number[], newLink: any) {
    setLinks(prev => {
      // Avoid replacing the whole object, only update the changed field
      const copy = JSON.parse(JSON.stringify(prev));
      let arr = copy;
      for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
      // Only update the changed field, not the whole object
      arr[path[path.length - 1]] = { ...arr[path[path.length - 1]], ...newLink };
      return copy;
    });
  }
  function deleteLink(path: number[]) {
    setLinks(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      let arr = copy;
      for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
      arr.splice(path[path.length - 1], 1);
      return copy;
    });
  }
  function addLink(path: number[]) {
    setLinks(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const newLink = { id: generateId(), label: '', url: '', children: [] };
      if (path.length === 0) {
        copy.push(newLink);
        return copy;
      }
      let arr = copy;
      // Traverse to the correct parent array
      for (let i = 0; i < path.length - 1; i++) arr = arr[path[i]].children;
      // If adding a subfolder (from +Subfolder), add to children of the target
      if (path.length > 0) {
        const parent = arr[path[path.length - 1]];
        if (!parent.children) parent.children = [];
        parent.children.push(newLink);
      }
      return copy;
    });
  }
  function addRootLink() { addLink([]); }

  function LinksEditor({ links, parentPath }: { links: any[]; parentPath?: number[] }) {
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
            <LinksEditor links={link.children || []} parentPath={[...(parentPath ?? []), idx]} />
          </React.Fragment>
        ))}
        {!parentPath && (
          <button
            type="button"
            onClick={() => addRootLink()}
            style={{
              color: '#8ec6ff',
              background: 'none',
              border: 'none',
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

  // New component for a single row, with local state for inputs
  function LinkRow({ link, idx, parentPath, updateLink, deleteLink, addLink }: any) {
    const [label, setLabel] = React.useState(link.label || '');
    const [url, setUrl] = React.useState(link.url || '');
    React.useEffect(() => { setLabel(link.label || ''); }, [link.label]);
    React.useEffect(() => { setUrl(link.url || ''); }, [link.url]);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, marginTop: 0 }}>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={e => updateLink([...parentPath, idx], { label: e.target.value })}
          placeholder="Folder or Link name"
          style={{ width: 120, padding: '0.2em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', fontSize: '0.98em' }}
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onBlur={e => updateLink([...parentPath, idx], { url: e.target.value })}
          placeholder="URL (leave blank for folder)"
          style={{ width: 160, padding: '0.2em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', fontSize: '0.98em' }}
        />
        <button type="button" onClick={() => deleteLink([...parentPath, idx])} style={{ color: '#e57373', background: 'none', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: 0, margin: 0 }}>✕</button>
        <button type="button" onClick={() => addLink([...parentPath, idx])} style={{ color: '#8ec6ff', background: 'none', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: 0, margin: 0 }}>+ Sub</button>
      </div>
    );
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setLogo(ev.target?.result as string);
        setLogoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Handler for delete
  function handleDelete() {
    setShowDeleteConfirm(true);
  }
  function confirmDelete() {
    // Pass a special value to onSave to indicate deletion
    onSave('__DELETE__', '', []);
  }
  function cancelDelete() {
    setShowDeleteConfirm(false);
  }

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2em', minWidth: 300 }}
    >
      <h2 style={{ margin: 0, fontSize: '1.3em', color: '#8ec6ff' }}>{title}</h2>
      <label style={{ fontWeight: 500 }}>
        Name
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', marginTop: 6, padding: '0.5em', borderRadius: 6, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
          required
        />
      </label>
      <label style={{ fontWeight: 500 }}>
        Logo
        <br/>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          style={{ marginTop: 6 }}
        />
      </label>
      {logoPreview && (
        <img src={logoPreview} alt="Preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #e0e0e0', margin: '0 auto' }} />
      )}
      <div>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Links</div>
        <LinksEditor links={links} />
      </div>
      <div style={{ display: 'flex', gap: '1em', justifyContent: 'flex-end', marginTop: 10 }}>
        <button type="button" onClick={onCancel} style={{ background: 'none', color: '#8ec6ff', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6 }}>Cancel</button>
        <button type="submit" onClick={()=>onSave(name, logo, links)} style={{ background: '#8ec6ff', color: '#23272f', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6 }}>Save</button>
        <button type="button" onClick={handleDelete} style={{ background: '#e57373', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6, marginLeft: 8 }}>Delete Project</button>
      </div>
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#23272f', borderRadius: 12, boxShadow: '0 8px 32px #000a', padding: '2em 2em 1.5em', minWidth: 320, textAlign: 'center', border: '2px solid #e57373' }}>
            <div style={{ color: '#e57373', fontWeight: 700, fontSize: '1.2em', marginBottom: 16 }}>Are you sure you want to delete this project?</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button onClick={confirmDelete} style={{ background: '#e57373', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.5em', borderRadius: 6 }}>Delete</button>
              <button onClick={cancelDelete} style={{ background: 'none', color: '#8ec6ff', border: '1.5px solid #8ec6ff', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.5em', borderRadius: 6 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default EditProjectDialog;
