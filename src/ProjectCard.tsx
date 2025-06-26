import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ToDoList, { ToDoItem } from './ToDoList';
import { MenuProvider, ContextMenu, useMenuContext } from './ContextMenu';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './EditProjectDialog';
import { useProjects } from './ProjectsProvider';
import './ProjectCard.css';

export interface QuickLink {
    label: string;
    url?: string;
    children?: QuickLink[];
}

interface QuickLinksDropdownProps {
    links: QuickLink[];
}

const QuickLinksDropdown: React.FC<QuickLinksDropdownProps & { projectName?: string }> = ({ links, projectName }) => {
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
                                <QuickLinksDropdown links={link.children} projectName={projectName} />
                            ) : (
                                link.url ? <a href={`ext+container:name=${projectName ?? ''}&url=${link.url}`} target="_blank" rel="noopener noreferrer">{link.label}</a> : link.label
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
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, dragHandleProps }) => {
  const menu = useMenuContext();
  const dialog = useDialog();
  const { updateProject, deleteProject, closeProject, openProject } = useProjects();
  const [proj, setProj] = useState(project);

  // Sync local state with prop changes
  React.useEffect(() => {
    setProj(project);
  }, [project]);

  function handleEdit() {
    dialog.openDialog(
      <EditProjectDialog
        title="Edit Project"
        name={proj.name}
        logo={proj.logo}
        links={proj.quickLinks}
        onSave={(name, logo, links) => {
          if (name === '__DELETE__') {
            deleteProject(proj.name);
            dialog.closeDialog();
            window.location.reload(); // Or trigger parent state update if needed
            return;
          }
          // If the project was renamed, update open projects list as well
          if (name !== proj.name) {
            updateProject(proj.name, { name, logo, quickLinks: links });
            setProj(p => ({ ...p, name, logo, quickLinks: links }));
            // Remove old name from openedProjects and add new name
            closeProject(proj.name);
            setTimeout(() => {
              // openProject may need to be called after state updates
              if (typeof window !== 'undefined') {
                // Use setTimeout to ensure context state is updated
                setTimeout(() => openProject(name), 0);
              }
            }, 0);
          } else {
            setProj(p => ({ ...p, name, logo, quickLinks: links }));
            updateProject(proj.name, { name, logo, quickLinks: links });
          }
          dialog.closeDialog();
        }}
        onCancel={dialog.closeDialog}
      />
    );
    menu.closeMenu();
  }

  function handleClose() {
    closeProject(proj.name);
    menu.closeMenu();
  }

  // Add setTodos function to update todos in context and local state
  const setTodos = (todos: ToDoItem[]) => {
    setProj(p => ({ ...p, todos }));
    updateProject(proj.name, { todos });
  };

  return (
    <div className="project-card">
      <div className="project-header">
        <img src={proj.logo} alt={proj.name + ' logo'} className="project-logo" />
        <div className="project-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1.2em', justifyContent: 'space-between', width: '100%' }}>
          <h2 className="project-name" style={{ margin: 0 }}>{proj.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              aria-label="Project menu"
              style={{ background: 'none', border: 'none', color: '#8ec6ff', fontSize: '1.6em', cursor: 'pointer', padding: '0 0.1em', borderRadius: 6, marginRight: 0 }}
              onClick={e => {
                e.stopPropagation();
                menu.openMenu(e.currentTarget);
              }}
              tabIndex={0}
            >
              &#x22EE;
            </button>
            {dragHandleProps && (
              <button
                aria-label="Drag to reorder"
                style={{ background: 'none', border: 'none', color: '#8ec6ff', fontSize: '1.6em', cursor: 'grab', padding: '0 0.1em', borderRadius: 6, marginLeft: 0 }}
                {...dragHandleProps}
                tabIndex={0}
              >
                ≡
              </button>
            )}
          </div>
        </div>
      </div>
      <ContextMenu>
        <MenuLinkItem
          link={{
            label: 'Links',
            children: proj.quickLinks,
          }}
          projectName={proj.name}
        />
        <li style={{ listStyle: 'none', padding: '0.3em 1.2em', borderTop: '1px solid #333', marginTop: 6 }}>
          <button
            onClick={handleEdit}
            style={{ background: 'none', color: '#8ec6ff', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: 0 }}
          >
            Edit Project
          </button>
        </li>
        <li style={{ listStyle: 'none', padding: '0.3em 1.2em' }}>
          <button
            onClick={handleClose}
            style={{ background: 'none', color: '#e57373', border: 'none', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: 0 }}
          >
            Close Project
          </button>
        </li>
        {/* Add more menu sections/options here later */}
      </ContextMenu>
      <div className="project-todos">
        <ToDoList todos={proj.todos} setTodos={setTodos} />
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
const MenuLinkItem: React.FC<{ link: QuickLink, projectName?: string }> = ({ link, projectName }) => {
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
                <MenuLinkItem key={i} link={child} projectName={projectName} />
              ))}
            </ul>
          )}
        </>
      ) : (
        link.url ? <a href={`ext+container:name=${projectName ?? ''}&url=${link.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8ec6ff', textDecoration: 'none' }}>{link.label}</a> : link.label
      )}
    </li>
  );
};
