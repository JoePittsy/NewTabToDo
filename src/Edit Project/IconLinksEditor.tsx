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
  function handleChange(field: keyof IconLink, value: string) {
    onChange({
      ...item,
      [field]: value
    });
  }

  function handleIconTypeChange(newType: 'favicon' | 'custom' | 'color') {
    onChange({
      ...item,
      iconType: newType
    });
    
    if (newType === 'favicon') {
      onFavicon();
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr auto',
      gap: 8,
      padding: 8,
      border: '1px solid #2d313a',
      borderRadius: 8,
      marginBottom: 8
    }}>
      {/* Left Column - Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          type="text"
          value={item.link || ''}
          onChange={e => handleChange('link', e.target.value)}
          placeholder="Link URL"
          style={{ padding: '0.4em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
        <input
          type="text"
          value={item.title || ''}
          onChange={e => handleChange('title', e.target.value)}
          placeholder="Title"
          style={{ padding: '0.4em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa' }}
        />
      </div>
      
      {/* Middle Column - Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('favicon');
            }}
            style={{
              background: item.iconType === 'favicon' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.2em 0.4em',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Favicon
          </button>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('custom');
            }}
            style={{
              background: item.iconType === 'custom' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.2em 0.4em',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Custom
          </button>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleIconTypeChange('color');
            }}
            style={{
              background: item.iconType === 'color' ? '#3a3f4b' : 'none',
              border: '1px solid #2d313a',
              color: '#8ec6ff',
              padding: '0.2em 0.4em',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Color
          </button>
        </div>
        
        {item.iconType === 'color' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <label style={{ fontSize: '0.85em', color: '#8ec6ff' }}>Color:</label>
              <input
                type="color"
                value={item.color || '#6c757d'}
                onChange={e => handleChange('color', e.target.value)}
                style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <label style={{ fontSize: '0.85em', color: '#8ec6ff' }}>Text:</label>
              <input
                type="text"
                value={item.text || ''}
                onChange={e => handleChange('text', e.target.value)}
                placeholder="A"
                maxLength={2}
                style={{ width: 28, padding: '0.2em', borderRadius: 4, border: '1px solid #2d313a', background: '#181b20', color: '#f3f6fa', textAlign: 'center' }}
              />
            </div>
          </div>
        )}
        
        {item.iconType === 'custom' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById(`icon-file-input-${idx}`)?.click();
              }}
              style={{ background: 'none', border: '1px solid #2d313a', color: '#8ec6ff', padding: '0.2em 0.4em', borderRadius: 4, cursor: 'pointer', fontSize: '0.9em' }}
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
              style={{ background: 'none', border: '1px solid #2d313a', color: '#8ec6ff', padding: '0.2em 0.4em', borderRadius: 4, cursor: 'pointer', fontSize: '0.9em' }}
            >
              Fetch Favicon
            </button>
          </div>
        )}
      </div>
      
      {/* Right Column - Preview & Delete */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 48, height: 48 }}>
          {item.iconType === 'favicon' && item.icon && (
            <img
              src={item.icon}
              alt="favicon"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={onFavicon}
            />
          )}
          {item.iconType === 'custom' && item.icon && (
            <img src={item.icon} alt="custom" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          )}
          {item.iconType === 'color' && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: item.color || '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.1em'
              }}
            >
              {item.text || (item.title?.[0] || '?')}
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
            fontSize: '0.9em',
            cursor: 'pointer',
            padding: '0.1em 0.3em'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default IconLinksEditor;
