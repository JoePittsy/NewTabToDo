import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ToDoItem {
  text: string;
  completed: boolean;
  completedAt?: number;
  order?: number;
}

interface ToDoListProps {
  todos: ToDoItem[];
  projectName?: string;
}

const ToDoList: React.FC<ToDoListProps> = ({ todos: initialTodos, projectName }) => {
  // Try to load from localStorage if projectName is provided
  const storageKey = projectName ? `todos-${projectName}` : undefined;
  const [todos, setTodos] = React.useState<ToDoItem[]>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return initialTodos;
  });
  const [newTodo, setNewTodo] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(Date.now());

  // On mount, assign order to todos if not present
  React.useEffect(() => {
    setTodos(todos => {
      let order = 0;
      return todos.map(t => t.order === undefined ? { ...t, order: order++ } : t);
    });
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // update every 1s
    return () => clearInterval(interval);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      // Find the max order among incomplete todos, or 0 if none
      const maxOrder = todos.filter(t => !t.completed).reduce((max, t) => t.order !== undefined && t.order > max ? t.order : max, -1);
      setTodos([
        ...todos,
        { text: newTodo, completed: false, order: maxOrder + 1 }
      ]);
      setNewTodo('');
    }
  };

  const handleToggle = (idx: number) => {
    // Instantly toggle completion
    if (!todos[idx].completed) {
      setTodos(todos => {
        const updated = todos.map((todo, i) =>
          i === idx ? { ...todo, completed: true, completedAt: Date.now() } : todo
        );
        // Sort: incomplete first, then completed by completedAt descending (newest first)
        return [
          ...updated.filter(t => !t.completed),
          ...updated.filter(t => t.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
        ];
      });
    } else {
      // If marking as incomplete, update immediately
      setTodos(todos => {
        const updated = todos.map((todo, i) =>
          i === idx ? { ...todo, completed: false, completedAt: undefined } : todo
        );
        return [
          ...updated.filter(t => !t.completed),
          ...updated.filter(t => t.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
        ];
      });
    }
  };

  // For incomplete, sort by order ascending
  const incomplete = todos.filter(t => !t.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const completed = todos.filter(t => t.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  // Use unique IDs for dnd-kit, not array indexes
  const incompleteIds = incomplete.map((todo) => {
    // Use a stable unique id for each todo, e.g. based on text + order
    return `${todo.text}__${todo.order ?? 0}`;
  });

  function formatCompletedDate(completedAt?: number): string | null {
    if (!completedAt) return null;
    const diff = now - completedAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
      // If more than 1 day ago, show locale date
      return new Date(completedAt).toLocaleDateString();
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds >= 30) {
      return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }
    else {
      return 'just now';
    }
  }

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setTodos(todos => {
        const incompleteTodos = todos.filter(t => !t.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        // Use the same id generation as above for correct mapping
        const ids = incompleteTodos.map(todo => `${todo.text}__${todo.order ?? 0}`);
        const oldIndex = ids.findIndex(id => id === active.id);
        const newIndex = ids.findIndex(id => id === over.id);
        if (oldIndex === -1 || newIndex === -1) return todos;
        const newIncomplete = arrayMove(incompleteTodos, oldIndex, newIndex);
        newIncomplete.forEach((t, i) => t.order = i);
        const completedTodos = todos.filter(t => t.completed);
        return [...newIncomplete, ...completedTodos];
      });
    }
  }

  // Save todos to localStorage on change
  React.useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(todos));
    }
  }, [todos, storageKey]);

  return (
    <div style={{display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden'}}>
      <form onSubmit={handleAdd} style={{ marginBottom: '1em', display: 'flex', gap: '0.5em', flexShrink: 0 }}>
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new to-do..."
          style={{ padding: '0.5em', width: '100%' }}
        />
      </form>
      {/* Proportional flex container for lists */}
      <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '0.5em'}}>
        {/* Incomplete (to-do) list: 66% */}
        <div style={{flex: 2, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <ul className="todo-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: 0, padding: 0 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={incompleteIds} strategy={verticalListSortingStrategy}>
                {incomplete.map((todo, idx) => (
                  <SortableItem
                    key={incompleteIds[idx]}
                    id={incompleteIds[idx]}
                    className={todo.completed ? 'completed' : ''}
                    isCompleted={todo.completed}
                    onToggle={() => handleToggle(todos.indexOf(todo))}
                    style={{ userSelect: 'none' }}
                    title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {todo.text}
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </ul>
        </div>
        {/* Completed list: 33% */}
        <div
          style={{
            flex: showCompleted ? 1 : 0.1,
            minHeight: 0,
            overflow: 'hidden',
            flexDirection: 'column',
            borderTop: '1px solid #444',
            margin: '0',
            paddingTop: '0.7em',
            transition: 'flex 0.4s cubic-bezier(0.4,0,0.2,1)', // Smooth flex grow/shrink
            display: 'flex',
          }}
        >
          <button
            type="button"
            onClick={() => setShowCompleted(v => !v)}
            aria-label={showCompleted ? 'Hide completed' : 'Show completed'}
            style={{
              background: 'none',
              color: '#8ec6ff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1em',
              marginBottom: '0.5em',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4em',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <ul className="todo-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', opacity: 0.7, margin: 0, padding: 0 }}>
              {completed.map((todo, idx) => (
                <li
                  key={idx}
                  onClick={() => handleToggle(todos.indexOf(todo))}
                  style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <span
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      maxWidth: '220px',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                  >
                    {todo.text}
                  </span>
                  <span style={{ fontSize: '0.9em', color: '#aaa', marginLeft: '1em', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                    {formatCompletedDate(todo.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Update SortableItem to accept drag handle props
function SortableItem({ id, children, className, style, onToggle, isCompleted, ...props }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'default',
        display: 'flex',
        alignItems: 'center',
      }}
      className={className}
      {...props}
    >
      {/* Drag handle */}
      <span
        {...listeners}
        {...attributes}
        style={{
          cursor: 'grab',
          marginRight: '0.7em',
          fontSize: '1.2em',
          color: '#8ec6ff',
          userSelect: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
        tabIndex={0}
        aria-label="Drag to reorder"
        onClick={e => e.stopPropagation()}
      >
        ≡
      </span>
      {/* To-do text, click to toggle */}
      <span
        onClick={onToggle}
        style={{ flex: 1, minWidth: 0, overflowX: 'auto', cursor: isCompleted ? 'pointer' : 'pointer' }}
      >
        {children}
      </span>
    </li>
  );
}

export default ToDoList;
