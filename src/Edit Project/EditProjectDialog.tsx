import React, { useState } from 'react';
import LinksEditor from './LinksEditor';
import IconLinksEditor from './IconLinksEditor';
import { Project } from '../ProjectsProvider';
import DialogHeader, { TabDef } from '../DialogHeader';

interface EditProjectDialogProps {
  project: Project;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, onSave, onCancel }) => {

  const TABS: TabDef[] = [
    {
      key: 'general',
      label: 'General',
    },
    {
      key: 'links',
      label: 'Links',
    },
    {
      key: 'iconLinks',
      label: 'Icon Links',
    }
  ]

  const [name, setName] = useState(project.name);
  const [logo, setLogo] = useState(project.logo);
  const [logoBackgroundColor, setLogoBackgroundColor] = useState(project.logoBackgroundColor || '#6c757d');
  const [logoPreview, setLogoPreview] = useState(project.logo);
  const [links, setLinks] = useState<any[]>(project.quickLinks || []);
  const [iconLinks, setIconLinks] = useState(project.iconLinks || []);
  const [activeTab, setActiveTab] = useState<string>('general');
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
    setLinks(ensureIds(JSON.parse(JSON.stringify(project.quickLinks || []))));
    // Add default iconType to existing iconLinks
    const iconLinksCopy = JSON.parse(JSON.stringify(project.iconLinks || []));
    const iconLinksWithDefault = iconLinksCopy.map((link: any) => ({
      ...link,
      iconType: link.iconType || 'favicon'
    }));
    setIconLinks(iconLinksWithDefault);
    // eslint-disable-next-line
  }, [project]); // Only run once on mount

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
    onSave({ ...project, name: '__DELETE__', logo: '', quickLinks: [], iconLinks: [], todos: [] });
  }
  function cancelDelete() {
    setShowDeleteConfirm(false);
  }

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2em', width: 600, height: 600 }}
      onSubmit={e => {
        e.preventDefault();
        onSave({
          ...project,
          name,
          logo,
          logoBackgroundColor,
          quickLinks: JSON.parse(JSON.stringify(links)),
          iconLinks: JSON.parse(JSON.stringify(iconLinks)),
        });
      }}
    >
      <DialogHeader title={project.name} onClose={onCancel} activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      {/* Tab content */}
      {activeTab === 'general' && (
        <>
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
            <br />
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ marginTop: 6 }}
            />
          </label>
          <label style={{ fontWeight: 500, marginTop: '1em' }}>
            Logo Background Color
            <input
              type="color"
              value={logoBackgroundColor}
              onChange={e => setLogoBackgroundColor(e.target.value)}
              style={{ width: '100%', marginTop: 6, padding: '0.5em', borderRadius: 6, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
            />
          </label>
          {logoPreview ? (
            <img src={logoPreview} alt="Preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #e0e0e0', margin: '0 auto' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1em' }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, background: logoBackgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8em', fontWeight: 'bold', color: '#fff' }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div style={{ marginTop: '0.5em', fontSize: '0.9em' }}>Preview</div>
            </div>
          )}
        </>
      )}
      {activeTab === 'links' && (
        <div style={{ overflowY: 'auto' }}>
          <LinksEditor
            links={links}
            updateLink={updateLink}
            deleteLink={deleteLink}
            addLink={addLink}
            addRootLink={addRootLink}
          />
        </div>
      )}
      {activeTab === 'iconLinks' && (
        <div style={{ overflowY: 'auto' }}>
          <IconLinksEditor iconLinks={iconLinks} setIconLinks={setIconLinks} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '1em', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <button type="button" onClick={onCancel} style={{ background: 'none', color: '#8ec6ff', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6 }}>Cancel</button>
        <button type="submit" style={{ background: '#8ec6ff', color: '#23272f', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.2em', borderRadius: 6 }}>Save</button>
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
