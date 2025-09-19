import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import ToDoList, { ToDoItem } from './ToDoList';
import { DialogProvider, useDialog } from './DialogProvider';
import EditProjectDialog from './Edit Project/EditProjectDialog';
import { useProjects, deepCloneProject, Project, AccordionState } from './ProjectsProvider';
import {
  Menu as ContexifyMenu,
  Item as ContexifyItem,
  Separator as ContexifySeparator,
  Submenu as ContexifySubmenu,
  useContextMenu as useContexifyContextMenu
} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import './ProjectCard.css';
import { useFormatLink, useSettings } from './SettingsProvider';

export interface QuickLink {
  label: string;
  url?: string;
  children?: QuickLink[];
}

interface ProjectCardProps {
  project: Project;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const computeAccordionState = (project: Project): AccordionState => {
  if (project.accordionState) {
    return {
      notesCollapsed: project.accordionState.notesCollapsed ?? false,
      todosCollapsed: project.accordionState.todosCollapsed ?? false,
    };
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches) {
    return { notesCollapsed: true, todosCollapsed: true };
  }

  return { notesCollapsed: false, todosCollapsed: false };
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, dragHandleProps }) => {
  const dialog = useDialog();
  const { updateProject, deleteProject, closeProject, openProject } = useProjects();
  const [proj, setProj] = useState(() => deepCloneProject(project));
  const [notesValue, setNotesValue] = useState(() => project.notes ?? '');
  const [accordionState, setAccordionState] = useState<AccordionState>(() => computeAccordionState(project));
  const [activeTab, setActiveTab] = useState<'notes' | 'todos' | 'completed'>('notes');
  const notesSaveHandle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesEditorRef = useRef<HTMLDivElement | null>(null);
  const projectNameRef = useRef(proj.name);
  const MENU_ID = React.useId ? React.useId() : `project-card-menu-${project.name}`;
  const { show: showMenu } = useContexifyContextMenu({ id: MENU_ID });

  const formatLink = useFormatLink();

  // Sync local state with prop changes
  React.useEffect(() => {
    if (notesSaveHandle.current) {
      clearTimeout(notesSaveHandle.current);
      notesSaveHandle.current = null;
    }

    const cloned = deepCloneProject(project);
    setProj(cloned);
    setNotesValue(cloned.notes ?? '');
    setAccordionState(computeAccordionState(cloned));
  }, [project]);

  React.useEffect(() => {
    projectNameRef.current = proj.name;
  }, [proj.name]);

  React.useEffect(() => {
    if (notesEditorRef.current && notesEditorRef.current.innerHTML !== notesValue) {
      notesEditorRef.current.innerHTML = notesValue;
    }
  }, [notesValue]);

  function handleEdit() {
    dialog.openDialog( () => 
      <EditProjectDialog
        project={deepCloneProject(proj)}
        onSave={updatedProject => {
          if (updatedProject.name === '__DELETE__') {
            deleteProject(proj.name);
            dialog.closeDialog();
            window.location.reload();
            return;
          }
          if (updatedProject.name !== proj.name) {
            updateProject(proj.name, updatedProject);
            setProj(updatedProject);
            closeProject(proj.name);
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                setTimeout(() => openProject(updatedProject.name), 0);
              }
            }, 0);
          } else {
            setProj(updatedProject);
            updateProject(proj.name, updatedProject);
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

  const setTodos = (todos: ToDoItem[]) => {
    setProj((p: any) => ({ ...p, todos: JSON.parse(JSON.stringify(todos)) }));
    updateProject(proj.name, { todos: JSON.parse(JSON.stringify(todos)) });
  };

  const handleExport = () => {
    const projectData = {
      ...proj,
      // Omit internal state properties
      todos: proj.todos.map(todo => ({
        text: todo.text,
        completed: todo.completed,
        completedAt: todo.completedAt,
        createdOn: todo.createdOn
      }))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${proj.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Open all links in the project
  const openAllLinks = () => {
    if (!proj.iconLinks) return;
    proj.iconLinks.forEach((link: any) => {
      if (link.link) {
        window.open(formatLink(proj.name, link.link), '_blank');
      }
    });
  };

  // Handle notes changes with debounce
  const handleNotesChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.innerHTML;
    setNotesValue(newValue);
    
    if (notesSaveHandle.current) {
      clearTimeout(notesSaveHandle.current);
    }
    
    notesSaveHandle.current = setTimeout(() => {
      setProj((prev: any) => {
        const updated = { ...prev, notes: newValue };
        updateProject(prev.name, updated);
        return updated;
      });
    }, 500);
  };

  return (
    <div className="project-card">
     {/* <div className="card bg-base-100 w-96 shadow-sm"> */}
      <div className="project-header">
        {proj.logo ? (
          <img src={proj.logo} alt={proj.name + ' logo'} className="project-logo" style={{objectFit: 'cover'}} />
        ) : (
          <div
            className="project-logo"
            style={{
              background: proj.logoBackgroundColor || '#6c757d',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.8em',
              border: '1px solid #e0e0e0',
              boxShadow: '0 1px 4px #0002',
              borderRadius: '0.5em',
              width: '56px',
              height: '56px',
              minWidth: '56px',
              minHeight: '56px',
              maxWidth: '56px',
              maxHeight: '56px',
              aspectRatio: '1 / 1',
            }}
          >
            {proj.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="project-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1.2em', justifyContent: 'space-between', width: '100%' }}>
          <h2 className="project-name">{proj.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              aria-label={proj.pinned ? "Unpin project" : "Pin project"}
              onClick={e => {
                e.stopPropagation();
                setProj(prev => {
                  const updated = { ...prev, pinned: !prev.pinned };
                  updateProject(proj.name, updated);
                  return updated;
                });
              }}
              className={`project-header-btn${proj.pinned ? ' pinned' : ''}`}
              tabIndex={0}
            >
              {proj.pinned ? '📌' : '📍'}
            </button>
            <button
              aria-label="Project menu"
              className="project-header-btn"
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
                className="project-header-btn drag"
                {...dragHandleProps}
                tabIndex={0}
              >
                ≡
              </button>
            )}
          </div>
        </div>
      </div>
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
        <ContexifyItem onClick={handleExport}>
          Export Project
        </ContexifyItem>
      </ContexifyMenu>

  <div className='icon-links'>
  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={openAllLinks}
            className="icon-link"
            tabIndex={0}
            aria-describedby={`all-links-tooltip-${proj.name}`}
            onMouseEnter={e => {
              const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
              if (tooltip) tooltip.style.opacity = '1';
            }}
            onMouseLeave={e => {
              const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
              if (tooltip) tooltip.style.opacity = '0';
            }}
            onFocus={e => {
              const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
              if (tooltip) tooltip.style.opacity = '1';
            }}
            onBlur={e => {
              const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
              if (tooltip) tooltip.style.opacity = '0';
            }}
          >
            <span style={{ fontSize: '1.8em' }}>🔗</span>
          </button>
          <span
            id={`all-links-tooltip-${proj.name}`}
            className="icon-tooltip"
            role="tooltip"
          >
            Open all links
          </span>
        </div>

        {proj.iconLinks?.map((link, idx) => {
          const tooltipId = `icon-link-tooltip-${proj.name.replace(/\s+/g, '-')}-${idx}`;
          let displayContent;
          if (link.icon) {
            displayContent = (
              <img
                src={link.icon}
                alt={link.title || 'Icon'}
                className="icon-link-img"
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.12)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            );
          } else {
            const displayText = link.text || (link.title ? link.title.charAt(0) : link.link.split('/')[2]?.charAt(0) || '?');
            // Use link.color if iconType is 'color', else fallback to project color or default
            const bgColor = link.iconType === 'color' && link.color ? link.color : (proj.logoBackgroundColor || '#6c757d');
            displayContent = (
              <div
                className="icon-link-text"
                style={{ background: bgColor, color: '#fff' }}
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.12)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {displayText.charAt(0).toUpperCase()}
              </div>
            );
          }
          return (
            <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <a
                href={formatLink(project.name, link.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-link"
                tabIndex={0}
                aria-describedby={tooltipId}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.open(formatLink(project.name, link.link), '_blank')
                  }
                }}
                onMouseEnter={e => {
                  const tooltip = document.getElementById(tooltipId);
                  if (tooltip) tooltip.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  const tooltip = document.getElementById(tooltipId);
                  if (tooltip) tooltip.style.opacity = '0';
                }}
                onFocus={e => {
                  const tooltip = document.getElementById(tooltipId);
                  if (tooltip) tooltip.style.opacity = '1';
                }}
                onBlur={e => {
                  const tooltip = document.getElementById(tooltipId);
                  if (tooltip) tooltip.style.opacity = '0';
                }}
              >
                {displayContent}
                <span
                  id={tooltipId}
                  className="icon-tooltip"
                  role="tooltip"
                >
                  {link.title || link.link}
                </span>
              </a>
            </div>
          );
        })}
      </div>

      <div className="project-body" style={{ display: 'flex', flexDirection: 'column', gap: '1em', marginTop: '0.5em', flex: 1 }}>
        {/* Tab Navigation */}
  {/* DaisyUI tabs-lift with tab-content, unique name per project */}
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
    <div className="tabs tabs-lift project-tabs-group" style={{ marginBottom: 0 }}>
      <input
        type="radio"
        name={`tabs_${proj.name.replace(/[^a-zA-Z0-9]/g, '_')}`}
        className="tab project-tab"
        aria-label="ToDo"
        checked={activeTab === 'todos'}
        onChange={() => setActiveTab('todos')}
        tabIndex={0}
      />
      <input
        type="radio"
        name={`tabs_${proj.name.replace(/[^a-zA-Z0-9]/g, '_')}`}
        className="tab project-tab"
        aria-label="Completed"
        checked={activeTab === 'completed'}
        onChange={() => setActiveTab('completed')}
        tabIndex={0}
      />
      <input
        type="radio"
        name={`tabs_${proj.name.replace(/[^a-zA-Z0-9]/g, '_')}`}
        className="tab project-tab"
        aria-label="Notes"
        checked={activeTab === 'notes'}
        onChange={() => setActiveTab('notes')}
        tabIndex={0}
      />
    </div>
    {/* Tab content blocks stacked below the tab group, always rendered, only one visible */}
    <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        className="tab-content bg-base-100 border-base-300 p-6"
        style={{
          display: activeTab === 'todos' ? 'block' : 'none',
          flex: 1,
          minHeight: 0,
          height: '100%',
          borderTop: 'none',
          borderRadius: '0 0 1em 1em',
        }}
      >
        <div className="project-todos" style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ToDoList todos={proj.todos} setTodos={setTodos} />
        </div>
      </div>
      <div
        className="tab-content bg-base-100 border-base-300 p-6"
        style={{
          display: activeTab === 'completed' ? 'block' : 'none',
          flex: 1,
          minHeight: 0,
          height: '100%',
          borderTop: 'none',
          borderRadius: '0 0 1em 1em',
        }}
      >
        <div className="project-completed" style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          <ul className="completed-list" style={{ flex: 1 }}>
            {proj.todos
              .filter((todo: ToDoItem) => todo.completed)
              .map((todo: ToDoItem, idx: number) => (
                <li
                  key={idx}
                  className="completed-list-item"
                >
                  <span className="completed-text">
                    {todo.text}
                  </span>
                  <span className="completed-date">
                    {todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
          </ul>
          <button
            onClick={() => {
              const updatedTodos = proj.todos.filter((todo: ToDoItem) => !todo.completed);
              setProj((prev: Project) => ({ ...prev, todos: updatedTodos }));
              updateProject(proj.name, { todos: updatedTodos });
            }}
            className="clear-all-btn"
            style={{ position: 'absolute', bottom: '1em', right: '1em' }}
          >
            Clear All
          </button>
        </div>
      </div>
      <div
        className="tab-content bg-base-100 border-base-300 p-6"
        style={{
          display: activeTab === 'notes' ? 'block' : 'none',
          flex: 1,
          minHeight: 0,
          height: '100%',
          borderTop: 'none',
          borderRadius: '0 0 1em 1em',
        }}
      >
        <div className="project-notes" style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            ref={notesEditorRef}
            contentEditable
            onInput={handleNotesChange}
            className="project-notes-editor"
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </div>
  </div>
      </div>
    </div>
  );
};

const ProjectCardWithProviders = (props: ProjectCardProps) => (
  <DialogProvider>
    <ProjectCard {...props} />
  </DialogProvider>
);

export default ProjectCardWithProviders;

const MenuLinkItem: React.FC<{ link: QuickLink, projectName?: string }> = ({ link, projectName }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const formatLink = useFormatLink();
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
        link.url ? <a href={formatLink(projectName??'', link.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#8ec6ff', textDecoration: 'none' }}>{link.label}</a> : link.label
      )}
    </li>
  );
};

const QuickLinksMenu: React.FC<{ links: QuickLink[], projectName: string }> = ({ links, projectName }) => {
  const formatLink = useFormatLink();

  return <>
    {links.map((link, idx) => {
      if (link.url && (!link.children || link.children.length === 0)) {
        return (
          <ContexifyItem key={idx} onClick={() => window.open(formatLink(projectName??'', link.url??''), '_blank')}>
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
        return (
          <ContexifyItem key={idx} disabled>
            {link.label}
          </ContexifyItem>
        );
      }
    })}
  </>;
};
