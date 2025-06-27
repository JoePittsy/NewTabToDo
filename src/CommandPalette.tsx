'use client'

import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Dialog,
    DialogPanel,
    DialogBackdrop,
} from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { DocumentPlusIcon, FolderIcon, FolderPlusIcon, HashtagIcon, TagIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid';
import { PlusCircleIcon, FolderOpenIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react'
import { useProjects } from './ProjectsProvider'
import { useDialog } from './DialogProvider'
import HelpDialog from './HelpDialog'
import SettingsDialog from './SettingsDialog';

export default function CommandPalette({ open, setOpen, onChange }: { open: boolean; setOpen: (open: boolean) => void; onChange?: (item: any) => void }) {
    const [query, setQuery] = useState('');
    const { projects, openedProjects,  openProject, setOpenedProjects } = useProjects();
    const dialog = useDialog();
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Sort unopened projects by most recent uncompleted to-do createdOn
    const unopened = projects
        .filter(p => !openedProjects.includes(p.name))
        .map(p => {
            // Find the most recent uncompleted to-do
            const uncompleted = (p.todos ?? []).filter((t: any) => !t.completed);
            return {
                ...p,
                lastNote: uncompleted.length > 0 ? Math.max(...uncompleted.map(t => t.createdOn || 0)) : 0
            };
        })
        .sort((a, b) => b.lastNote - a.lastNote);

    const filteredProjects =
        query === ''
            ? []
            : unopened.filter((project) => {
                return project.name.toLowerCase().includes(query.toLowerCase())
            })

    // Define quickActions here so it's always in scope
    const quickActions = [
        { name: 'Create a new Project...', icon: PlusCircleIcon, action: 'createProject' },
        { name: 'Open All Projects', icon: FolderOpenIcon, action: 'openAll' },
        { name: 'Open projects with active to-dos', icon: CheckCircleIcon, action: 'openActiveTodos' },
        { name: 'Close All Projects', icon: XCircleIcon, action: 'closeAll' },
        { name: 'Show Help', icon: InformationCircleIcon, action: 'showHelp' },
        { name: 'Settings', icon: TagIcon, action: 'settings' },
    ]

    function handleShowHelp() {
        dialog.openDialog(
            <HelpDialog onClose={dialog.closeDialog} />
        );
    }

    function handleQuickAction(action: string) {
        if (action === 'openAll') {
            setOpen(false);
            setQuery('');
            // Open all unopened projects
            const unopenedNames = projects.filter(p => !openedProjects.includes(p.name)).map(p => p.name);
            if (unopenedNames.length > 0) {
                // Use setOpenedProjects to open all
                setTimeout(() => {
                    // Add unopened to openedProjects, preserving order
                    const all = [...openedProjects, ...unopenedNames.filter(n => !openedProjects.includes(n))];
                    // Remove duplicates
                    setOpenedProjects(Array.from(new Set(all)));
                }, 0);
            }
        } else if (action === 'openActiveTodos') {
            setOpen(false);
            setQuery('');
            // Open all projects with at least one uncompleted to-do
            const activeTodoProjects = projects.filter(p => (p.todos ?? []).some((t: any) => !t.completed) && !openedProjects.includes(p.name)).map(p => p.name);
            if (activeTodoProjects.length > 0) {
                setTimeout(() => {
                    const all = [...openedProjects, ...activeTodoProjects.filter(n => !openedProjects.includes(n))];
                    setOpenedProjects(Array.from(new Set(all)));
                }, 0);
            }
        } else if (action === 'closeAll') {
            setOpen(false);
            setQuery('');
            setTimeout(() => setOpenedProjects([]), 0);
        } else if (action === 'showHelp') {
            setOpen(false);
            setQuery('');
            handleShowHelp();
        } else if (action === 'createProject') {
            if (onChange) {
                onChange({ query });
            }
        } else if (action === 'settings') {
            setOpen(false);
            setQuery('');
            dialog.openDialog(<SettingsDialog onClose={dialog.closeDialog} />);
        }
    }

    // Reset selection when palette opens/closes or query changes
    useEffect(() => {
        setSelectedProjects([]);
        setLastActiveIndex(null);
    }, [open, query]);

    // Keyboard navigation for multi-select
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            // Use only Ctrl (or Cmd) for multi-select, not Ctrl+Shift
            if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                const list = query === '' ? unopened : filteredProjects;
                if (!list.length) return;
                let idx = lastActiveIndex;
                // Try to get the focused item from the DOM if lastActiveIndex is null
                if (idx === null && list.length > 0) {
                    // Find the focused ComboboxOption
                    const active = document.activeElement;
                    let foundIdx = -1;
                    if (active && listRef.current) {
                        const options = Array.from(listRef.current.querySelectorAll('[role="option"]'));
                        foundIdx = options.findIndex(opt => opt === active);
                    }
                    idx = foundIdx >= 0 ? foundIdx : 0;
                    setLastActiveIndex(idx);
                    const name = list[idx].name;
                    setSelectedProjects(prev => prev.includes(name) ? prev : [...prev, name]);
                    return;
                }
                let nextIdx = idx ?? 0;
                if (e.key === 'ArrowDown') nextIdx = Math.min(nextIdx + 1, list.length - 1);
                if (e.key === 'ArrowUp') nextIdx = Math.max(nextIdx - 1, 0);
                setLastActiveIndex(nextIdx);
                const namesToSelect = [list[idx ?? 0].name, list[nextIdx].name];
                setSelectedProjects(prev => {
                    let newSel = [...prev];
                    for (const n of namesToSelect) {
                        if (!newSel.includes(n)) newSel.push(n);
                    }
                    return newSel;
                });
            }

            // Enter opens all selected
            if (e.key === 'Enter' && selectedProjects.length > 0) {
                e.preventDefault();
                setOpen(false);
                setQuery('');
                setTimeout(() => {
                    setOpenedProjects(Array.from(new Set([...openedProjects, ...selectedProjects])));
                }, 0);
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, unopened, filteredProjects, selectedProjects, lastActiveIndex, query]);

    return (
        <Dialog
            className="relative z-10"
            open={open}
            onClose={() => {
                setOpen(false)
                setQuery('')
            }}
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/25 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                <DialogPanel
                    transition
                    className="mx-auto max-w-2xl transform divide-y divide-gray-500/20 overflow-hidden rounded-xl bg-gray-900 shadow-2xl transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                >
                    <Combobox
                        onChange={(item: any) => {
                            if (item && item.name && projects.some(p => p.name === item.name)) {
                                openProject(item.name);
                                setOpen(false);
                                setQuery('');
                                return;
                            }
                            if (item && item.action) {
                                handleQuickAction(item.action);
                                return;
                            }
                            if (item && item.url) {
                                window.location = item.url;
                                return;
                            }
                            // Fix: if item has a 'query' property, treat as create project
                            if (item && typeof item.query === 'string' && onChange) {
                                onChange({ query: item.query });
                                return;
                            }
                            if (onChange) {
                                onChange(item);
                            }
                        }}
                    >
                        <div className="grid grid-cols-1">
                            <ComboboxInput
                                autoFocus
                                className="col-start-1 row-start-1 h-12 w-full bg-transparent pr-4 pl-11 text-base text-white outline-hidden placeholder:text-gray-500 sm:text-sm"
                                placeholder="Search..."
                                onChange={(event) => setQuery(event.target.value)}
                                onBlur={() => setQuery('')}
                                onKeyDown={e => {
                                    const list = query === '' ? unopened : filteredProjects;
                                    // Multi-select with Ctrl/Cmd+ArrowUp/Down
                                    if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                                        if (!list.length) return;
                                        let idx = lastActiveIndex;
                                        // Use [data-focus] to find the focused item
                                        if (listRef.current) {
                                            const focused = listRef.current.querySelector('[data-focus]');
                                            if (focused) {
                                                const options = Array.from(listRef.current.querySelectorAll('[role="option"]'));
                                                const foundIdx = options.findIndex(opt => opt === focused);
                                                if (foundIdx >= 0) idx = foundIdx;
                                            }
                                        }
                                        if (idx === null) idx = 0;
                                        let nextIdx = idx;
                                        if (e.key === 'ArrowDown') nextIdx = Math.min(nextIdx + 1, list.length - 1);
                                        if (e.key === 'ArrowUp') nextIdx = Math.max(nextIdx - 1, 0);
                                        setLastActiveIndex(nextIdx);
                                        const namesToSelect = [list[idx].name, list[nextIdx].name];
                                        setSelectedProjects(prev => {
                                            let newSel = [...prev];
                                            for (const n of namesToSelect) {
                                                if (!newSel.includes(n)) newSel.push(n);
                                            }
                                            return newSel;
                                        });
                                        
                                    }
                                    // Space toggles selection for focused item
                                    if (e.key === ' ' || e.key === 'Spacebar') {
                                        let idx = lastActiveIndex;
                                        if (listRef.current) {
                                            const focused = listRef.current.querySelector('[data-focus]');
                                            if (focused) {
                                                const options = Array.from(listRef.current.querySelectorAll('[role="option"]'));
                                                const foundIdx = options.findIndex(opt => opt === focused);
                                                if (foundIdx >= 0) idx = foundIdx;
                                            }
                                        }
                                        if (idx !== null && list[idx]) {
                                            e.preventDefault();
                                            setLastActiveIndex(idx);
                                            const name = list[idx].name;
                                            setSelectedProjects(prev => prev.includes(name)
                                                ? prev.filter(n => n !== name)
                                                : [...prev, name]);
                                        }
                                    }
                                    // Enter opens all selected
                                    if (e.key === 'Enter' && selectedProjects.length > 0) {
                                        e.preventDefault();
                                        setOpen(false);
                                        setQuery('');
                                        setTimeout(() => {
                                            setOpenedProjects(Array.from(new Set([...openedProjects, ...selectedProjects])));
                                        }, 0);
                                    }
                                }}
                            />
                            <MagnifyingGlassIcon
                                className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-gray-500"
                                aria-hidden="true"
                            />
                        </div>
                        {( unopened.length > 0 || filteredProjects.length > 0) && (
                            <ComboboxOptions
                                static
                                as="ul"
                                ref={listRef}
                                className="max-h-80 scroll-py-2 divide-y divide-gray-500/20 overflow-y-auto"
                            >
                                <li className="p-2">
                                    {query === '' && (
                                        <>
                                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-200">Unopened Projects</h2>
                                            <ul className="text-sm text-gray-400">
                                                {unopened.map((project, idx) => (
                                                    <ComboboxOption
                                                        key={project.name}
                                                        value={project}
                                                        className={`group flex cursor-default items-center rounded-md px-3 py-2 select-none data-focus:bg-gray-800 data-focus:text-white data-focus:outline-hidden `}
                                                        aria-selected={selectedProjects.includes(project.name)}
                                                        onClick={() => {
                                                            // Single click: open project
                                                            openProject(project.name);
                                                            setOpen(false);
                                                            setQuery('');
                                                        }}
                                                        onKeyDown={e => {
                                                            // Space toggles selection
                                                            if (e.key === ' ' || e.key === 'Spacebar') {
                                                                e.preventDefault();
                                                                setLastActiveIndex(idx);
                                                                setSelectedProjects(prev => prev.includes(project.name)
                                                                    ? prev.filter(n => n !== project.name)
                                                                    : [...prev, project.name]);
                                                            }
                                                        }}
                                                    >
                                                        {/* Checkmark for selected */}
                                                        <span style={{ width: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {selectedProjects.includes(project.name) && (
                                                                <CheckIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                                                            )}
                                                        </span>
                                                        {project.logo ? (
                                                            <img
                                                                src={project.logo}
                                                                alt={project.name + ' logo'}
                                                                className="size-6 flex-none rounded bg-white object-contain border border-gray-300"
                                                                style={{ width: 24, height: 24 }}
                                                            />
                                                        ) : (
                                                            <FolderIcon
                                                                className="size-6 flex-none text-gray-500 group-data-focus:text-white forced-colors:group-data-focus:text-[Highlight]"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <span className="ml-3 flex-auto truncate">{project.name}</span>
                                                        <span className="ml-3 text-xs text-gray-400" style={{ minWidth: 110, textAlign: 'right' }}
                                                            title={project.lastNote > 0 ? new Date(project.lastNote).toLocaleString() : undefined}
                                                        >
                                                            {project.lastNote > 0 ? `${project.todos.filter(t => !t.completed).length} - 
                                                                ${new Date(project.lastNote).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                                                                : 'No active to-dos'}
                                                        </span>
                                                        <span className="ml-3 hidden flex-none text-gray-400 group-data-focus:inline">Jump to...</span>
                                                    </ComboboxOption>
                                                ))}
                                            </ul>

                                        </>
                                    )}
                                    {query !== '' && (
                                        <ul className="text-sm text-gray-400">
                                            {filteredProjects.map((project) => (
                                                <ComboboxOption
                                                    key={project.name}
                                                    value={project}
                                                    className="group flex cursor-default items-center rounded-md px-3 py-2 select-none data-focus:bg-gray-800 data-focus:text-white data-focus:outline-hidden"
                                                >
                                                    {project.logo ? (
                                                        <img
                                                            src={project.logo}
                                                            alt={project.name + ' logo'}
                                                            className="size-6 flex-none rounded bg-white object-contain border border-gray-300"
                                                            style={{ width: 24, height: 24 }}
                                                        />
                                                    ) : (
                                                        <FolderIcon
                                                            className="size-6 flex-none text-gray-500 group-data-focus:text-white forced-colors:group-data-focus:text-[Highlight]"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <span className="ml-3 flex-auto truncate">{project.name}</span>
                                                    <span className="ml-3 hidden flex-none text-gray-400 group-data-focus:inline">Jump to...</span>
                                                </ComboboxOption>
                                            ))}

                                        </ul>
                                    )}
                                </li>
                            </ComboboxOptions>
                        )}

                        
                            <ComboboxOptions static as="ul" className="max-h-80 scroll-py-2 divide-y divide-gray-500/20 overflow-y-auto">
                                <li className="p-2">
                                    <ul className="text-sm text-gray-400">
                                        {quickActions.map((action: any) => (
                                            <ComboboxOption
                                                key={action.name}
                                                value={action}
                                                className="group flex cursor-default items-center rounded-md px-3 py-2 select-none data-focus:bg-gray-800 data-focus:text-white data-focus:outline-hidden"
                                            >
                                                <action.icon
                                                    className="size-6 flex-none text-gray-500 group-data-focus:text-white forced-colors:group-data-focus:text-[Highlight]"
                                                    aria-hidden="true"
                                                />
                                                <span className="ml-3 flex-auto truncate">{action.action === 'createProject' ? `Create project${query ? ` "${query}"` : ''}` : action.name}</span>
                                            </ComboboxOption>
                                        ))}
                                    </ul>
                                </li>
                            </ComboboxOptions>
                        
                    </Combobox>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
