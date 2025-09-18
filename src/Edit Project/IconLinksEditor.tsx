import React from 'react';

interface IconLinksEditorProps {
  iconLinks: { link: string; icon?: string; title?: string; color?: string; text?: string }[];
  setIconLinks: (iconLinks: { link: string; icon?: string; title?: string; color?: string; text?: string }[]) => void;
}

const IconLinksEditor: React.FC<IconLinksEditorProps> = ({ iconLinks, setIconLinks }) => {
  function handleChange(idx: number, field: 'link' | 'icon' | 'title' | 'color' | 'text', value: string) {
    const updated = iconLinks.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setIconLinks(updated);
  }
  function handleAdd() {
    setIconLinks([...iconLinks, { link: '', icon: '', title: '' }]);
  }
  function handleDelete(idx: number) {
    setIconLinks(iconLinks.filter((_, i) => i !== idx));
  }
  function handleIconFile(idx: number, file: File) {
    const reader = new FileReader();
    reader.onload = ev => {
      handleChange(idx, 'icon', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
  function handleFavicon(idx: number) {
    const url = iconLinks[idx]?.link;
    if (!url) return;
    try {
      const u = new URL(url);
      // Use origin for favicon
      const favicon = `${u.origin}/favicon.ico`;
      handleChange(idx, 'icon', favicon);
    } catch {
      // fallback: do nothing
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {iconLinks.map((item, idx) => (
        <IconLinkRow
          key={idx}
          idx={idx}
          item={item}
          onChange={updated => {
            const updatedLinks = iconLinks.map((it, i) => i === idx ? updated : it);
            setIconLinks(updatedLinks);
          }}
          onDelete={() => handleDelete(idx)}
          onIconFile={file => handleIconFile(idx, file)}
          onFavicon={() => handleFavicon(idx)}
        />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{ color: '#8ec6ff', background: 'none', fontWeight: 600, fontSize: '0.98em', cursor: 'pointer', marginTop: 2, padding: 0, display: 'block', alignSelf: 'flex-start' }}
      >
        + Add Icon Link
      </button>
    </div>
  );
};

const IconLinkRow: React.FC<{
  idx: number;
  item: { link: string; icon?: string; title?: string; color?: string; text?: string };
  onChange: (item: { link: string; icon?: string; title?: string; color?: string; text?: string }) => void;
  onDelete: () => void;
  onIconFile: (file: File) => void;
  onFavicon: () => void;
}> = ({ idx, item, onChange, onDelete, onIconFile, onFavicon }) => {
  const [link, setLink] = React.useState(item.link || '');
  const [title, setTitle] = React.useState(item.title || '');
  const [icon, setIcon] = React.useState(item.icon || '');
  const [color, setColor] = React.useState(item.color || '#6c757d');
  const [text, setText] = React.useState(item.text || '');

  React.useEffect(() => { setLink(item.link || ''); }, [item.link]);
  React.useEffect(() => { setTitle(item.title || ''); }, [item.title]);
  React.useEffect(() => { setIcon(item.icon || ''); }, [item.icon]);
  React.useEffect(() => { setColor(item.color || '#6c757d'); }, [item.color]);
  React.useEffect(() => { setText(item.text || ''); }, [item.text]);

  // Only update parent onBlur or when finalized
  function commit() {
    onChange({ link, icon, title, color, text });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, border: '1px solid #2d313a', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          onBlur={commit}
          placeholder="Link URL"
          style={{ flex: 2, padding: '0.3em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={commit}
          placeholder="Title"
          style={{ flex: 1.5, padding: '0.3em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
        <button type="button" onClick={onDelete} style={{ color: '#e57373', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1em', cursor: 'pointer', padding: 0, margin: 0 }}>✕</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: '0.9em', color: '#8ec6ff' }}>Color:</label>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            onBlur={commit}
            style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: '0.9em', color: '#8ec6ff' }}>Text:</label>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={commit}
            placeholder="A"
            maxLength={2}
            style={{ width: 32, padding: '0.3em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', textAlign: 'center' }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            document.getElementById(`icon-file-input-${idx}`)?.click();
          }}
          style={{ background: 'none', border: 'none', color: '#8ec6ff', fontWeight: 700, fontSize: '1.3em', cursor: 'pointer', padding: 0, margin: 0 }}
          title="Upload icon image"
        >
          🖼️
        </button>
        <input
          id={`icon-file-input-${idx}`}
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onIconFile(file);
          }}
          style={{ display: 'none' }}
        />
        <button type="button" onClick={onFavicon} style={{ color: '#8ec6ff', background: 'none', border: 'none', fontWeight: 700, fontSize: '1.1em', cursor: 'pointer', padding: 0, margin: 0 }} title="Use favicon">🌐</button>
        {icon ? (
          <img src={icon} alt="icon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, background: '#fff', border: '1px solid #e0e0e0' }} />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.2em',
              border: '1px solid #e0e0e0'
            }}
          >
            {text || (title?.[0] || '?')}
          </div>
        )}
      </div>
    </div>
  );
};

export default IconLinksEditor;
