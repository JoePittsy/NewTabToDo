import React from 'react';

interface LinkRowProps {
  link: any;
  idx: number;
  parentPath: number[];
  updateLink: (path: number[], newLink: any) => void;
  deleteLink: (path: number[]) => void;
  addLink: (path: number[]) => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ link, idx, parentPath, updateLink, deleteLink, addLink }) => {
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
        style={{ width: 120, padding: '0.2em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', fontSize: '0.98em', flexGrow: '1' }}
      />
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onBlur={e => updateLink([...parentPath, idx], { url: e.target.value })}
        placeholder="URL (leave blank for folder)"
        style={{ width: 160, padding: '0.2em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', fontSize: '0.98em', flexGrow: '1' }}
      />
      <button type="button" onClick={() => deleteLink([...parentPath, idx])} style={{ color: '#e57373', background: 'none', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: 0, margin: 0 }}>✕</button>
      <button type="button" onClick={() => addLink([...parentPath, idx])} style={{ color: '#8ec6ff', background: 'none', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: 0, margin: 0 }}>+ Sub</button>
    </div>
  );
};

export default LinkRow;
