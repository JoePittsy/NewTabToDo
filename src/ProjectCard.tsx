import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ToDoList, { ToDoItem } from './ToDoList';
import { MenuProvider, ContextMenu, useMenuContext } from './ContextMenu';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './EditProjectDialog';
import './ProjectCard.css';

export interface QuickLink {
    label: string;
    url?: string;
    children?: QuickLink[];
}

interface QuickLinksDropdownProps {
    links: QuickLink[];
}

const QuickLinksDropdown: React.FC<QuickLinksDropdownProps> = ({ links }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="quick-links-dropdown">
            <button onClick={() => setOpen((o) => !o)} className="dropdown-toggle">
                Links
            </button>
            {open && (
                <ul className="dropdown-menu">
                    {links.map((link, idx) => (
                        <li key={idx}>
                            {Array.isArray(link.children) && link.children.length > 0 ? (
                                <QuickLinksDropdown links={link.children} />
                            ) : (
                                link.url ? <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a> : link.label
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface ProjectCardProps {
    project: {
        name: string;
        logo: string;
        todos: ToDoItem[];
        quickLinks: QuickLink[];
    };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const menu = useMenuContext();
  const dialog = useDialog();
  const [proj, setProj] = useState(project);

  // Save project edits to localStorage and update UI
  React.useEffect(() => {
    // Only save if the name or logo changed
    if (proj.name !== project.name || proj.logo !== project.logo) {
      // Save to localStorage under a project-specific key
      localStorage.setItem(`project-${proj.name}`, JSON.stringify(proj));
    }
  }, [proj, project.name, project.logo]);

  // On mount, load project from localStorage if available
  React.useEffect(() => {
    const stored = localStorage.getItem(`project-${project.name}`);
    if (stored) {
      try {
        setProj(JSON.parse(stored));
      } catch {}
    }
  }, [project.name]);

  function handleEdit() {
    dialog.openDialog(
      <EditProjectDialog
      title="Edit Project"
        name={proj.name}
        logo={proj.logo}
        onSave={(name, logo) => {
          setProj(p => ({ ...p, name, logo }));
          dialog.closeDialog();
        }}
        onCancel={dialog.closeDialog}
      />
    );
    menu.closeMenu();
  }

  return (
    <div className="project-card">
      <div className="project-header">
        <img src={proj.logo} alt={proj.name + ' logo'} className="project-logo" />
        <div className="project-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1.2em', justifyContent: 'space-between', width: '100%' }}>
          <h2 className="project-name" style={{ margin: 0 }}>{proj.name}</h2>
          <button
            aria-label="Project menu"
            style={{ background: 'none', border: 'none', color: '#8ec6ff', fontSize: '1.6em', cursor: 'pointer', padding: '0 0.3em', borderRadius: 6 }}
            onClick={e => {
              e.stopPropagation();
              menu.openMenu(e.currentTarget);
            }}
            tabIndex={0}
          >
            &#x22EE;
          </button>
        </div>
      </div>
      <ContextMenu>
        <MenuLinkItem
          link={{
            label: 'Links',
            children: proj.quickLinks,
          }}
        />
        <li style={{ listStyle: 'none', padding: '0.3em 1.2em', borderTop: '1px solid #333', marginTop: 6 }}>
          <button
            onClick={handleEdit}
            style={{ background: 'none', color: '#8ec6ff', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: 0 }}
          >
            Edit Project
          </button>
        </li>
        {/* Add more menu sections/options here later */}
      </ContextMenu>
      <div className="project-todos">
        <ToDoList todos={proj.todos} projectName={proj.name} />
      </div>
    </div>
  );
};

// Wrap export with MenuProvider
const ProjectCardWithProviders = (props: ProjectCardProps) => (
  <MenuProvider>
    <DialogProvider>
      <ProjectCard {...props} />
    </DialogProvider>
  </MenuProvider>
);

export default ProjectCardWithProviders;

// Recursive menu link item for submenus
const MenuLinkItem: React.FC<{ link: QuickLink }> = ({ link }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const hasChildren = Array.isArray(link.children) && link.children.length > 0;
  return (
    <li
      style={{ position: 'relative', padding: '0.3em 1.2em', cursor: hasChildren ? 'pointer' : undefined, listStyle: 'none' }}
      onMouseEnter={() => hasChildren && setSubmenuOpen(true)}
      onMouseLeave={() => hasChildren && setSubmenuOpen(false)}
    >
      {hasChildren ? (
        <>
          <span style={{ opacity: 0.7 }}>{link.label} ▶</span>
          {submenuOpen && (
            <ul
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                minWidth: 180,
                background: '#23272f',
                border: '1px solid #2d313a',
                borderRadius: 8,
                boxShadow: '0 4px 24px #0006',
                margin: 0,
                padding: '0.3em 0',
                zIndex: 10000,
                listStyle: 'none',
              }}
            >
              {link.children!.map((child, i) => (
                <MenuLinkItem key={i} link={child} />
              ))}
            </ul>
          )}
        </>
      ) : (
        link.url ? <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8ec6ff', textDecoration: 'none' }}>{link.label}</a> : link.label
      )}
    </li>
  );
};
