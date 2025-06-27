import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ToDoList, { ToDoItem } from './ToDoList';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './Edit Project/EditProjectDialog';
import { useProjects, deepCloneProject } from './ProjectsProvider';
import {
  Menu as ContexifyMenu,
  Item as ContexifyItem,
  Separator as ContexifySeparator,
  Submenu as ContexifySubmenu,
  useContextMenu as useContexifyContextMenu
} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import './ProjectCard.css';

export interface QuickLink {
  label: string;
  url?: string;
  children?: QuickLink[];
}



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
  const dialog = useDialog();
  const { updateProject, deleteProject, closeProject, openProject } = useProjects();
  // Always deep clone project for local state to avoid shared references
  const [proj, setProj] = useState(() => deepCloneProject(project));
  const MENU_ID = React.useId ? React.useId() : `project-card-menu-${project.name}`;
  const { show: showMenu } = useContexifyContextMenu({ id: MENU_ID });

  // Sync local state with prop changes, always deep clone
  React.useEffect(() => {
    setProj(deepCloneProject(project));
  }, [project]);

  function handleEdit() {
    // Always pass a deep clone of the current project links to the dialog
    dialog.openDialog(
      <EditProjectDialog
        title="Edit Project"
        name={proj.name}
        logo={proj.logo}
        links={deepCloneProject(proj).quickLinks}
        onSave={(name, logo, links) => {
          if (name === '__DELETE__') {
            deleteProject(proj.name);
            dialog.closeDialog();
            window.location.reload(); // Or trigger parent state update if needed
            return;
          }
          // If the project was renamed, update open projects list as well
          if (name !== proj.name) {
            updateProject(proj.name, { name, logo, quickLinks: JSON.parse(JSON.stringify(links)) });
            setProj((p: typeof proj) => ({ ...p, name, logo, quickLinks: JSON.parse(JSON.stringify(links)) }));
            closeProject(proj.name);
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                setTimeout(() => openProject(name), 0);
              }
            }, 0);
          } else {
            setProj((p: typeof proj) => ({ ...p, name, logo, quickLinks: JSON.parse(JSON.stringify(links)) }));
            updateProject(proj.name, { name, logo, quickLinks: JSON.parse(JSON.stringify(links)) });
          }
          dialog.closeDialog();
        }}
        onCancel={dialog.closeDialog}
      />
    );
  }

  function handleClose() {
    closeProject(proj.name);
  }

  // Add setTodos function to update todos in context and local state
  const setTodos = (todos: ToDoItem[]) => {
    setProj((p: typeof proj) => ({ ...p, todos: JSON.parse(JSON.stringify(todos)) }));
    updateProject(proj.name, { todos: JSON.parse(JSON.stringify(todos)) });
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
                showMenu({ event: e });
              }}
              onContextMenu={e => {
                e.preventDefault();
                showMenu({ event: e });
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
      {/* Contextify Menu */}
      <ContexifyMenu id={MENU_ID} animation="fade">
        <ContexifySubmenu label="Links" disabled={proj.quickLinks.length === 0}> 
          <QuickLinksMenu links={proj.quickLinks} projectName={proj.name} />
        </ContexifySubmenu>
        <ContexifySeparator />
        <ContexifyItem onClick={handleEdit}>
          Edit Project
        </ContexifyItem>
        <ContexifyItem onClick={handleClose}>
          Close Project
        </ContexifyItem>
      </ContexifyMenu>
      <div className="project-todos">
        <ToDoList todos={proj.todos} setTodos={setTodos} />
      </div>
    </div>
  );
};

// Wrap export with MenuProvider
const ProjectCardWithProviders = (props: ProjectCardProps) => (
  <DialogProvider>
    <ProjectCard {...props} />
  </DialogProvider>
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

// Recursive component to render QuickLink as ContexifyItem or ContexifySubmenu
const QuickLinksMenu: React.FC<{ links: QuickLink[], projectName: string }> = ({ links, projectName }) => {
  return <>
    {links.map((link, idx) => {
      if (link.url && (!link.children || link.children.length === 0)) {
        return (
          <ContexifyItem key={idx} onClick={() => window.open(`ext+container:name=${projectName}&url=${link.url}`, '_blank')}>
            {link.label}
          </ContexifyItem>
        );
      } else if (link.children && link.children.length > 0) {
        return (
          <ContexifySubmenu key={idx} label={link.label}>
            <QuickLinksMenu links={link.children} projectName={projectName} />
          </ContexifySubmenu>
        );
      } else {
        // No url, no children: just label, disabled
        return (
          <ContexifyItem key={idx} disabled>
            {link.label}
          </ContexifyItem>
        );
      }
    })}
  </>;
};
