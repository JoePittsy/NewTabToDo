import React from 'react';

interface IconLink {
  link: string;
  icon?: string;
  title?: string;
  color?: string;
  text?: string;
  iconType: 'favicon' | 'custom' | 'color'; // New field
}

interface IconLinksEditorProps {
  iconLinks: IconLink[];
  setIconLinks: (iconLinks: IconLink[]) => void;
}

const IconLinksEditor: React.FC<IconLinksEditorProps> = ({ iconLinks, setIconLinks }) => {
  function handleChange(idx: number, field: keyof IconLink, value: string) {
    const updated = iconLinks.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setIconLinks(updated);
  }
  function handleAdd() {
    const newLink: IconLink = {
      link: '',
      title: '',
      iconType: 'favicon'
    };
    setIconLinks([...iconLinks, newLink]);
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
      const favicon = `${u.origin}/favicon.ico`;
      setIconLinks(iconLinks.map((item, i) =>
        i === idx ? {
          ...item,
          iconType: 'favicon',
          icon: favicon
        } : item
      ));
    } catch {
      // Fallback to color mode
      setIconLinks(iconLinks.map((item, i) =>
        i === idx ? {
          ...item,
          iconType: 'color'
        } : item
      ));
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
            const updatedLinks = iconLinks.map((it, i) => i === idx ? updated : it) as IconLink[];
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
  item: IconLink;
  onChange: (item: IconLink) => void;
  onDelete: () => void;
  onIconFile: (file: File) => void;
  onFavicon: () => void;
}> = ({ idx, item, onChange, onDelete, onIconFile, onFavicon }) => {
  const [link, setLink] = React.useState(item.link || '');
  const [title, setTitle] = React.useState(item.title || '');
  const [icon, setIcon] = React.useState(item.icon || '');
  const [color, setColor] = React.useState(item.color || '#6c757d');
  const [text, setText] = React.useState(item.text || '');
  const [iconType, setIconType] = React.useState<'favicon' | 'custom' | 'color'>(item.iconType as 'favicon' | 'custom' | 'color' || 'favicon');
  React.useEffect(() => {
    setIconType(item.iconType as 'favicon' | 'custom' | 'color' || 'favicon');
  }, [item.iconType]);

  React.useEffect(() => { setLink(item.link || ''); }, [item.link]);
  React.useEffect(() => { setTitle(item.title || ''); }, [item.title]);
  React.useEffect(() => { setIcon(item.icon || ''); }, [item.icon]);
  React.useEffect(() => { setColor(item.color || '#6c757d'); }, [item.color]);
  React.useEffect(() => { setText(item.text || ''); }, [item.text]);

  // Only update parent onBlur or when finalized
  function commit() {
    const updatedItem: IconLink = {
      link,
      icon,
      title,
      color,
      text,
      iconType
    };
    onChange(updatedItem);
  }
  
  function handleIconTypeChange(newType: 'favicon' | 'custom' | 'color') {
    setIconType(newType);
    // When switching to favicon, try to fetch automatically
    if (newType === 'favicon') {
      onFavicon();
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: 16,
      padding: 12,
      border: '1px solid #2d313a',
      borderRadius: 8,
      marginBottom: 12
    }}>
      {/* Left Column - Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          onBlur={commit}
          placeholder="Link URL"
          style={{ padding: '0.5em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={commit}
          placeholder="Title"
          style={{ padding: '0.5em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
      </div>
      
      {/* Middle Column - Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('favicon');
              commit();
            }}
            style={{
              background: iconType === 'favicon' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.3em 0.6em',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Favicon
          </button>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('custom');
              commit();
            }}
            style={{
              background: iconType === 'custom' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.3em 0.6em',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Custom
          </button>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('color');
              commit();
            }}
            style={{
              background: iconType === 'color' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.3em 0.6em',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Color
          </button>
        </div>
        
        {iconType === 'color' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          </div>
        )}
        
        {iconType === 'custom' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById(`icon-file-input-${idx}`)?.click();
              }}
              style={{ background: 'none', border: '1px solid #2d313a', color: '#8ec6ff', padding: '0.3em 0.6em', borderRadius: 4, cursor: 'pointer' }}
            >
              Upload
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
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onFavicon();
              }}
              style={{ background: 'none', border: '1px solid #2d313a', color: '#8ec6ff', padding: '0.3em 0.6em', borderRadius: 4, cursor: 'pointer' }}
            >
              Fetch Favicon
            </button>
          </div>
        )}
      </div>
      
      {/* Right Column - Preview & Delete */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 64, height: 64 }}>
          {iconType === 'favicon' && icon && (
            <img
              src={icon}
              alt="favicon"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
              onError={onFavicon} // Retry on error
            />
          )}
          {iconType === 'custom' && icon && (
            <img src={icon} alt="custom" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          )}
          {iconType === 'color' && (
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
                fontSize: '1.2em'
              }}
            >
              {text || (title?.[0] || '?')}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            color: '#e57373',
            fontWeight: 700,
            fontSize: '1.1em',
            cursor: 'pointer',
            padding: '0.3em 0.6em'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default IconLinksEditor;
