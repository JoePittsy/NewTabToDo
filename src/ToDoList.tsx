import React, { useState } from 'react';
import ReactDOM from 'react-dom';
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
import { TrashIcon } from '@heroicons/react/24/outline';
import { useSettings } from './SettingsProvider';

export interface ToDoItem {
  text: string;
  completed: boolean;
  completedAt?: number;
  order?: number;
  createdOn?: number;
  _animating?: boolean;
}


interface ToDoListProps {
  todos: ToDoItem[];
  setTodos: (todos: ToDoItem[]) => void;
  showOnlyCompleted?: boolean;
}


const ToDoList: React.FC<ToDoListProps> = ({ todos, setTodos, showOnlyCompleted = false }) => {
  const [newTodo, setNewTodo] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [dragging, setDragging] = useState(false);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const settings = useSettings();

  // On mount, assign order to todos if not present
  React.useEffect(() => {
    let order = 0;
    const withOrder = todos.map((t: ToDoItem) => t.order === undefined ? { ...t, order: order++ } : t);
    if (withOrder.some((t, i) => t.order !== todos[i]?.order)) {
      setTodos(withOrder);
    }
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // update every 1s
    return () => clearInterval(interval);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      // Find the max order among incomplete todos, or 0 if none
      const maxOrder = todos.filter((t: ToDoItem) => !t.completed).reduce((max: number, t: ToDoItem) => t.order !== undefined && t.order > max ? t.order : max, -1);
      setTodos([
        ...todos,
        { text: newTodo, completed: false, order: maxOrder + 1, createdOn: Date.now() }
      ]);
      setNewTodo('');
    }
  };

  const handleToggle = (idx: number) => {
    // Animate strike-through before moving to completed
    if (!todos[idx].completed) {
      // Set a temporary flag for animation
      const updated = todos.map((todo: ToDoItem, i: number) =>
        i === idx ? { ...todo, _animating: true } : todo
      );
      setTodos(updated);
      setTimeout(() => {
        const completed = todos.map((todo: ToDoItem, i: number) =>
          i === idx ? { ...todo, completed: true, completedAt: Date.now(), _animating: false } : { ...todo, _animating: false }
        );
        setTodos([
          ...completed.filter((t: ToDoItem) => !t.completed),
          ...completed.filter((t: ToDoItem) => t.completed).sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
        ]);
        if (settings?.General?.showFireworks !== false) {
          window.dispatchEvent(new Event('firework'));
        }
      }, 250);
    } else {
      const updated = todos.map((todo: ToDoItem, i: number) =>
        i === idx ? { ...todo, completed: false, completedAt: undefined } : todo
      );
      setTodos([
        ...updated.filter((t: ToDoItem) => !t.completed),
        ...updated.filter((t: ToDoItem) => t.completed).sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      ]);
    }
  };


  // For incomplete, sort by order ascending
  const incomplete = todos.filter((t: ToDoItem) => !t.completed).sort((a: ToDoItem, b: ToDoItem) => (a.order ?? 0) - (b.order ?? 0));
  const completed = todos.filter((t: ToDoItem) => t.completed).sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  // Use unique IDs for dnd-kit, not array indexes
  const incompleteIds = incomplete.map((todo: ToDoItem) => {
    // Use a stable unique id for each todo, e.g. based on text + order
    return `${todo.text}__${todo.order ?? 0}`;
  });
  const completedIds = completed.map((todo: ToDoItem) => `${todo.text}__${todo.completedAt ?? 0}`);

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

  function handleDragStart(event: any) {
    setDragging(true);

  }

  function handleDragEnd(event: any) {
    setDragging(false);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const incompleteTodos = todos.filter((t: ToDoItem) => !t.completed).sort((a: ToDoItem, b: ToDoItem) => (a.order ?? 0) - (b.order ?? 0));
      // Use the same id generation as above for correct mapping
      const ids = incompleteTodos.map((todo: ToDoItem) => `${todo.text}__${todo.order ?? 0}`);
      const oldIndex = ids.findIndex((id: string) => id === active.id);
      const newIndex = ids.findIndex((id: string) => id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newIncomplete = arrayMove(incompleteTodos, oldIndex, newIndex);
      newIncomplete.forEach((t: ToDoItem, i: number) => (t.order = i));
      const completedTodos = todos.filter((t: ToDoItem) => t.completed);
      setTodos([...newIncomplete, ...completedTodos]);
    }
  }

  // Remove to-do without completing
  function handleDeleteTodo(idx: number) {
    setTodos([...todos.filter((_, i) => i !== idx)]);
  }

  // InfoLine component for active to-dos
  function InfoLine({ createdOn, onDelete, showConfirm, setShowConfirm }: { createdOn?: number, onDelete: () => void, showConfirm: boolean, setShowConfirm: (v: boolean) => void }) {
    const [nowInfo, setNowInfo] = useState(Date.now());
    React.useEffect(() => {
      const interval = setInterval(() => setNowInfo(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);
    let timeOpen = '';
    if (createdOn) {
      const diff = nowInfo - createdOn;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) timeOpen = `${hours}h ${minutes % 60}m`;
      else if (minutes > 0) timeOpen = `${minutes}m ${seconds % 60}s`;
      else timeOpen = `${seconds}s`;
    }
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75em', color: '#8ec6ff', padding: '0.1em 0.5em 0.3em 0em', minHeight: 22 }}>
          <span>{timeOpen}</span>
          <span
            style={{ cursor: 'pointer', color: '#e57373', fontWeight: 700, fontSize: '1.1em', marginLeft: 8 }}
            title="Remove to-do"
            onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
          >
            ×
          </span>
        </div>
        {showConfirm && ReactDOM.createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.45)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: '#23272f', borderRadius: 12, boxShadow: '0 8px 32px #000a', padding: '2em 2em 1.5em', minWidth: 320, textAlign: 'center', border: '2px solid #e57373' }}>
              <div style={{ color: '#e57373', fontWeight: 700, fontSize: '1.1em', marginBottom: 16 }}>Remove this to-do without completing it?</div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button onClick={() => { setShowConfirm(false); onDelete(); }} style={{ background: '#e57373', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.5em', borderRadius: 6 }}>Remove</button>
                <button onClick={() => setShowConfirm(false)} style={{ background: 'none', color: '#8ec6ff', border: '1.5px solid #8ec6ff', fontWeight: 600, fontSize: '1em', cursor: 'pointer', padding: '0.5em 1.5em', borderRadius: 6 }}>Cancel</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  function handleClearCompleted() {
    setTodos(todos.filter((t: ToDoItem) => !t.completed));
    setShowClearConfirm(false);
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Only show input if not completed-only view */}
      {!showOnlyCompleted && (
        <form onSubmit={handleAdd} style={{ marginBottom: '1em', display: 'flex', gap: '0.5em', flexShrink: 0 }}>
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            placeholder="Add a new to-do..."
            style={{ padding: '0.5em', width: '100%', marginLeft: '4px', marginRight: '4px' }}
          />
        </form>
      )}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: "auto",
          overflowY: "auto",
          // background: "#23272f",
          borderRadius: "8px",
          padding: "0.5em",
        }}>
        <ul className="todo-list" style={{ margin: 0, padding: 0 }}>
          {/* Show incomplete or completed based on prop */}
          {!showOnlyCompleted ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart} >
              <SortableContext items={incompleteIds} strategy={verticalListSortingStrategy}>
                {incomplete.map((todo: ToDoItem, idx: number) => (
                  <React.Fragment key={incompleteIds[idx]}>
                    <SortableItem
                      id={incompleteIds[idx]}
                      className={todo.completed ? 'completed' : todo._animating ? 'animating' : ''}
                      isCompleted={todo.completed}
                      onTextClick={() => {
                        if (confirmIdx !== idx) handleToggle(todos.indexOf(todo));
                      }}
                      style={{ userSelect: 'none' }}
                      title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <span
                        style={{
                          textDecoration: todo.completed || todo._animating ? 'line-through' : 'none',
                          transition: 'text-decoration 0.2s',
                          color: todo._animating ? '#8ec6ff' : undefined,
                        }}
                      >
                        {todo.text}
                      </span>
                      <InfoLine
                        createdOn={todo.createdOn}
                        onDelete={() => handleDeleteTodo(todos.indexOf(todo))}
                        showConfirm={confirmIdx === idx}
                        setShowConfirm={v => setConfirmIdx(v ? idx : null)}
                      />
                    </SortableItem>
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            completed.map((todo: ToDoItem, idx: number) => (
              <li
                key={completedIds[idx]}
                className={todo.completed ? 'completed' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 1,
                  cursor: 'pointer',
                  padding: '0.5em 0',
                  borderBottom: '1px solid #2c3440',
                }}
                onClick={() => handleToggle(todos.indexOf(todo))}
                title="Mark as incomplete"
              >
                <span
                  style={{
                    textDecoration: 'line-through',
                    color: '#8ec6ff',
                    flex: 1,
                  }}
                >
                  {todo.text}
                </span>
                <span style={{ fontSize: '0.8em', color: '#8ec6ff', marginLeft: 8 }}>
                  {formatCompletedDate(todo.completedAt)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

// Update SortableItem to accept drag handle props
function SortableItem({ id, children, className, style, isCompleted, ...props }: any) {
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
        onClick={props.onTextClick}
        style={{ flex: 1, minWidth: 0, overflowX: 'auto', cursor: isCompleted ? 'pointer' : 'pointer' }}
      >
        {children}
      </span>
    </li>
  );
}

export default ToDoList;
