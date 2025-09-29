import React, { useState, useRef } from 'react';
import pinSvg from './assets/pin.svg';
import unpinSvg from './assets/unpin.svg';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [activeTab, setActiveTab] = useState<'notes' | 'todos' | 'completed'>('todos');
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
    setProj((p: Project) => ({ ...p, todos: JSON.parse(JSON.stringify(todos)) }));
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
      setProj((prev: Project) => {
        const updated = { ...prev, notes: newValue };
        updateProject(prev.name, updated);
        return updated;
      });
    }, 500);
  };

  return (
    <div className="project-card">
      {/* <div className="card bg-base-100 w-96 shadow-sm"> */}

       {/* <button onClick={handleEdit}>Edit</button>
        <button onClick={handleClose}>Close</button>
        <button onClick={handleExport}>Export</button> */}

      <div className='ProjectCardQuickActions pt-2 pr-5'  style={{ display: 'flex', justifyContent:'flex-end', position: 'relative', gap: '0em', zIndex:1 }}>
        
        {dragHandleProps && (
              <button
                style={{marginRight: '6em'}}
                aria-label="Drag to reorder"
                className="project-header-btn drag"
                {...dragHandleProps}
                tabIndex={0}
              >
                <img style={{height: '1em',width: '1em', rotate: '90deg'}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAgklEQVR4nO3UsQmAQAyFYUWxdFR3cAGHcCOt3EIsrH8JpAqCMVgcmK9+BO4SXlWVDGiB+qvcI6AHZuAEDmACumjOTYdZYzTnAjT6AmuL5NxkV8B+M3CJ5F7RXVlDNOcmByK7km8DVhl2d7XeXCoX2VxGNpfK5koFI5vLyOZS2Vw/dwHed3H44QsrtwAAAABJRU5ErkJggg==" alt="drag-handle"></img>
              </button>
            )}


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="project-quick-action-btn">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABmUlEQVR4nN2VzStEYRTGZ3yMQs3/oGymbJSFjx2KUj7Kwl5JjPIfXCvKzmLKQha+yoL/gbKzwaRIYv4BTUSKn06Oel3n3vcdZePZ3Lnvec7z3Pfced6byfxrAA3ACLALnAEPwCNwCWwDk0Djb8UHgFv8uAbGahVfAd4DxC+c39JTFyK+RBjuRRCYA551bdknPl6D+JDT1w+8aG00STwH3HmEe1IeTnYiuDJfPDDle+xM+u5lXOdKnbAI+x7949T5fmoUlbtlFW+0uGOI9/rEVaOg/LJVrGoxD0Qxg74EQcnJKpDV+2blVy2yJFTQqveRb1TOWukrA1IHjiwDib+g4KxFloNhINgE6tPmt6HEYmw9CjQQ7CWeTcCwE/9vkSfcQHAINFkGWeBUSfOxWqUGA8Fs0i66gFeN/WBsd5UUA+kRHCS+A6dpRk9SMVlwx2UYCG8NWNTSG9AeYjLtHF5lNeowDLr1mndyVPIaaFMncGINOIEvOxE8AS1BJtooX7Z1zYmE8WeIPnlt+kmVIycXbFAL5BQw/6J/iQ8xje2qB77gBAAAAABJRU5ErkJggg==" alt="internet" className="project-quick-action-icon"></img>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[10em]  bg-zinc-800 border-zinc-600 p-1 z-50 rounded-selector shadow-lg">
            <DropdownMenuLabel>Project Links</DropdownMenuLabel>
            <DropdownMenuSeparator className="h-px bg-zinc-600 my-1"/>
            {proj.quickLinks && proj.quickLinks.length > 0 ? (
              proj.quickLinks.map((link, idx) =>
                link.url ? (
                  <DropdownMenuItem className='data-[highlighted]:bg-zinc-600 rounded'
                    key={idx}
                    onClick={() => window.open(formatLink(proj.name, link.url!), '_blank')}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={idx} disabled>
                    {link.label}
                  </DropdownMenuItem>
                )
              )
            ) : (
              <DropdownMenuItem disabled>No links</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={handleEdit}
          className="project-quick-action-btn"
        >
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAuElEQVR4nO2Uuw3CMBRFXbJBBOtAAUyTJWigJqswRmgQSRtmICUHObKVxAJ/Ypc+5fPTPfaNFCESA6yBO3BOnT0AVIxcROKbl8AKuClBbS4dgRd+9MBuEt6o+UlJrnJuCmLDNeW/Zw4E1FIAD+a0wCZaQGj4VOBRSxEc7hD0RudP47zRH1TvLa4Ie/hWXiZW8DNcnb3lMJWgNTsHPtECG1ngJAuSCHx/1zY6m+AgF1hOB+zdb82IkS9ivt889VHIRQAAAABJRU5ErkJggg==" alt="edit" className="project-quick-action-icon"></img>
        </button>
        <button
          onClick={handleClose}
          className="project-quick-action-btn"
        >
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABS0lEQVR4nO2WO04DMRCG9xIUPIIoKUIVOsIBkABxDvLgLHQgEAUlfQg3YbkACLqwdCT60EiOZKH17KzXUVLkl1ay7P317cx6xs6ytVZNwC4wAF6AHPhxT+7m+kArJXAbuAWmVGsGPAF7TaEXQEF9fQPnsdArF0GsxDuMiXTWAOrDbZEDO5Hp1dK+ZQE/kF53lpIJ7d4j4BD4LFmTuQ7QDXinkkkNLHUaUse90/4Hl3HbrcmHhdTTwGPF6APm8LK5kEYa+E0xlsGtUFGugS27+Qs48Dz7wIfBVywC/G7wTVYy1eNlba7+AsvpUgO3lAbSrWggsnYc8P6qDcTB70mvGxXqHfzS2FNpAmxWgh38xHjjsByLZyaoBx8muAgMakHnkkM8Mu2S3tOsiYAN4NrtTEuUj+Z/WuNm0gOegVfXXgs3HkmdVpbMWtkS9AcczgesBTVL2QAAAABJRU5ErkJggg==" alt="cancel" className="project-quick-action-icon"></img>
        </button>
        <button
          onClick={handleExport}
          className="project-quick-action-btn"
        >
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABiklEQVR4nO3Wu2sVQRiG8fUCUYOSJp0xIEgI1raS1ElQQfAPMNimsEwjKcQyWGuRQAiBdLm0SfACBluFaJVOtPCSRtT4k4E5sBmyu+csew4IedpvZp7dd7+Z2Sw74X8HZzCOp9jHi27KzmEKz/HFUfabll2IskV8V8x8E7JBTGMDPwtEf5PaWF3ZFTzAGn4r5wBLUS7GfrYT2VXM4GVukSo+4m4S+7N2ZNfxCO91zmZMJp07USXdVo+QxlyIE+tJ7Ufo9irx6xrSEOntOD/IU1baifk8FjqQfgifJs69VdAH9yrFuQcI3furQhoiHYjjR/DtmDFhO11qWxwXu4lPxywW3uoJTsdxF/Gu6OE6krbAZbxJGuVOrn4KqyWp3M/qgr6wD7GH0aQWtl0Rf8IJV1vcIt0SmMRhiXgnaxpcw1flzDQt7StppnwDDjcqDsT7toy3WRcv/N0S8WxXxAEM4XOB+Ej3N078p0rv5r2uSlvgYSJ+nPUKLOfEN3op7scrbIVjtGfiE7I2+AcEHXWoJXkgBAAAAABJRU5ErkJggg==" alt="filled-sent" className="project-quick-action-icon"></img>
        </button>

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
          className="project-quick-action-btn"
        >
          {proj.pinned ? (
            <img src={unpinSvg} alt="Pinned" className="project-quick-action-icon" />
          ) : (
            <img src={pinSvg} alt="Unpinned" className="project-quick-action-icon" />
          )}
        </button>

      </div>


      <div className="project-header">
        {proj.logo ? (
          <img src={proj.logo} alt={proj.name + ' logo'} className="project-logo" style={{ objectFit: 'cover' }} />
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
            {/* <button
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
            </button> */}
            {/* {dragHandleProps && (
              <button
                aria-label="Drag to reorder"
                className="project-header-btn drag"
                {...dragHandleProps}
                tabIndex={0}
              >
                ≡
              </button>
            )} */}
          </div>
        </div>
      </div>
      {/* <ContexifyMenu id={MENU_ID} animation="fade">
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
      </ContexifyMenu> */}

      <div className='icon-links'>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={openAllLinks}
            className="icon-link"
            tabIndex={0}
            aria-describedby={`all-links-tooltip-${proj.name}`}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.12)';
              const tooltip = document.getElementById(`all-links-tooltip-${proj.name}`);
              if (tooltip) tooltip.style.opacity = '1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
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
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAs0lEQVR4nO3SMQ6DMAyFYS4B6hFQT5JztwNDO5WheypVvcWPQJkQCXYwRa3yRkT8OY6rquQXA1yJpzsKZjd41kQNPL4KAw3QB68XwYADXujyAc4RtJHC3hIN30Xw+k/rb/oETqqaZMCxm862/WIKJ8Y7jV/T/ZQt4wVa4L0LTGK8YeEwh0kskqb5HPi2dFNNjVy4A+5LqLSGzSGLGhQ4IwUW5UjYYxOvhZ0BPp53ykGV/FkG5WgPFpZBmkQAAAAASUVORK5CYII=" alt="external-link" className="icon-link-img" style={{background: 'rgba(255, 255, 255, 0.1)', border: 0}} />
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

        {/* Tab Navigation */}
        {/* DaisyUI tabs-lift with tab-content, unique name per project */}


        <div className='flex flex-col h-full overflow-hidden'>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-700 bg-zinc-800 rounded-t-lg">
            <button
              onClick={() => setActiveTab('todos')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === 'todos'
                  ? 'border-zinc-400 text-zinc-200 bg-zinc-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50'
              }`}
              aria-label="ToDo"
            >
              ToDo
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === 'completed'
                  ? 'border-zinc-400 text-zinc-200 bg-zinc-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50'
              }`}
              aria-label="Completed"
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === 'notes'
                  ? 'border-zinc-400 text-zinc-200 bg-zinc-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-zinc-600/50'
              }`}
              aria-label="Notes"
            >
              Notes
            </button>
          </div>

          {/* Tab content blocks stacked below the tab group, always rendered, only one visible */}
          <div className='flex-1 overflow-scroll bg-zinc-800 rounded-b-lg border border-zinc-700 border-t-0'>

            {/* To Do Tab */}
            <div
              className="contents"
              style={{
                display: activeTab === 'todos' ? 'block' : 'none',
              }}
            >
              <div className="project-todos pt-4" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

                  <ToDoList todos={proj.todos} setTodos={setTodos} />

                </div>
              </div>

            </div>

            {/* Completed Tab */}
            <div
              // className="contents"
              className="contents"
              style={{
                display: activeTab === 'completed' ? 'block' : 'none',
              }}
            > 
            
              <div className="project-todos pt-4" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <button
                    onClick={() => {
                      const updatedTodos = proj.todos.filter((todo: ToDoItem) => !todo.completed);
                      setProj((prev: Project) => ({ ...prev, todos: updatedTodos }));
                      updateProject(proj.name, { todos: updatedTodos });
                    }}
                    className="clear-all-btn"
                    style={{ margin: 'auto' }}
                  >
                  Clear All
                  </button>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {/* Added a flag, this renders only completed todos with input bar */}
                  <ToDoList todos={proj.todos} setTodos={setTodos} showOnlyCompleted />
                </div>
              </div>

              

            </div>


            {/* Notes Tab */}
            <div
              className="contents"
              style={{
                display: activeTab === 'notes' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <div style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' , padding: '0.5em' }}>

                <textarea
                  value={notesValue}
                  onChange={e => {
                    setNotesValue(e.target.value);
                    if (notesSaveHandle.current) clearTimeout(notesSaveHandle.current);
                    notesSaveHandle.current = setTimeout(() => {
                      setProj((prev: Project) => {
                        const updated = { ...prev, notes: e.target.value };
                        updateProject(prev.name, updated);
                        return updated;
                      });
                    }, 500);
                  }}

                  className="project-notes-editor"
                  style={{ height: '100%', resize: 'none' }}
                />
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
                // left: '100%',
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
        link.url ? <a href={formatLink(projectName ?? '', link.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#8ec6ff', textDecoration: 'none' }}>{link.label}</a> : link.label
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
          <ContexifyItem key={idx} onClick={() => window.open(formatLink(projectName ?? '', link.url ?? ''), '_blank')}>
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
