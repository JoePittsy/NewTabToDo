import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { useSettings } from "@/SettingsProvider";
import { CSS } from "@dnd-kit/utilities";
import React, { useState } from "react";
import ReactDOM from "react-dom";

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
    const [newTodo, setNewTodo] = useState("");
    const [now, setNow] = useState(Date.now());
    const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
    const settings = useSettings();

    // On mount, assign order to todos if not present
    React.useEffect(() => {
        let order = 0;
        const withOrder = todos.map((t: ToDoItem) => (t.order === undefined ? { ...t, order: order++ } : t));
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
            const maxOrder = todos
                .filter((t: ToDoItem) => !t.completed)
                .reduce((max: number, t: ToDoItem) => (t.order !== undefined && t.order > max ? t.order : max), -1);
            setTodos([...todos, { text: newTodo, completed: false, order: maxOrder + 1, createdOn: Date.now() }]);
            setNewTodo("");
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
                    i === idx
                        ? { ...todo, completed: true, completedAt: Date.now(), _animating: false }
                        : { ...todo, _animating: false }
                );
                setTodos([
                    ...completed.filter((t: ToDoItem) => !t.completed),
                    ...completed
                        .filter((t: ToDoItem) => t.completed)
                        .sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
                ]);
                if (settings?.General?.showFireworks !== false) {
                    window.dispatchEvent(new Event("firework"));
                }
            }, 250);
        } else {
            const updated = todos.map((todo: ToDoItem, i: number) =>
                i === idx ? { ...todo, completed: false, completedAt: undefined } : todo
            );
            setTodos([
                ...updated.filter((t: ToDoItem) => !t.completed),
                ...updated
                    .filter((t: ToDoItem) => t.completed)
                    .sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
            ]);
        }
    };

    // For incomplete, sort by order ascending
    const incomplete = todos
        .filter((t: ToDoItem) => !t.completed)
        .sort((a: ToDoItem, b: ToDoItem) => (a.order ?? 0) - (b.order ?? 0));
    const completed = todos
        .filter((t: ToDoItem) => t.completed)
        .sort((a: ToDoItem, b: ToDoItem) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
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
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (seconds >= 30) {
            return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
        } else {
            return "just now";
        }
    }

    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            const incompleteTodos = todos
                .filter((t: ToDoItem) => !t.completed)
                .sort((a: ToDoItem, b: ToDoItem) => (a.order ?? 0) - (b.order ?? 0));
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
    function InfoLine({
        createdOn,
        onDelete,
        showConfirm,
        setShowConfirm,
    }: {
        createdOn?: number;
        onDelete: () => void;
        showConfirm: boolean;
        setShowConfirm: (v: boolean) => void;
    }) {
        const [nowInfo, setNowInfo] = useState(Date.now());
        React.useEffect(() => {
            const interval = setInterval(() => setNowInfo(Date.now()), 1000);
            return () => clearInterval(interval);
        }, []);
        let timeOpen = "";
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
                <div className="flex justify-between items-center text-xs text-blue-300 min-h-6">
                    <span>{timeOpen}</span>
                    <span
                        className="cursor-pointer text-red-400 font-bold text-base ml-2"
                        title="Remove to-do"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(true);
                        }}
                    >
                        ×
                    </span>
                </div>
                {showConfirm &&
                    ReactDOM.createPortal(
                        <div className="fixed inset-0 w-full h-full bg-black/45 z-[99999] flex items-center justify-center">
                            <div className="bg-zinc-800 border border-red-400 rounded-md p-8">
                                <div className="mb-4 text-red-300 font-bold">
                                    Remove this to-do without completing it?
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => {
                                            setShowConfirm(false);
                                            onDelete();
                                        }}
                                        className="bg-red-400 cursor-pointer text-white font-bold py-2 px-4 rounded"
                                    >
                                        Remove
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="bg-transparent cursor-pointer text-blue-300 border border-blue-400 font-semibold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
            </>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden px-2">
            {!showOnlyCompleted && (
                <form onSubmit={handleAdd} className="flex gap-4 mb-4 shrink-0">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a new to-do..."
                        className="border border-zinc-600 bg-zinc-800 rounded-md grow p-4 mx-2 py-2 text-base text-zinc-100 outline-none  w-7/12 transition-colors focus:border-zinc-400"
                    />
                </form>
            )}
            <div className="p-4">
                <ul>
                    {/* Show incomplete or completed based on prop */}
                    {!showOnlyCompleted ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={incompleteIds} strategy={verticalListSortingStrategy}>
                                {incomplete.map((todo: ToDoItem, idx: number) => (
                                    <React.Fragment key={incompleteIds[idx]}>
                                        <SortableItem
                                            id={incompleteIds[idx]}
                                            className={
                                                todo.completed ? "completed" : todo._animating ? "animating" : ""
                                            }
                                            onTextClick={() => {
                                                if (confirmIdx !== idx) handleToggle(todos.indexOf(todo));
                                            }}
                                            style={{ userSelect: "none" }}
                                            title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                                        >
                                            <span
                                                style={{
                                                    textDecoration:
                                                        todo.completed || todo._animating ? "line-through" : "none",
                                                    transition: "text-decoration 0.2s",
                                                    color: todo._animating ? "#8ec6ff" : undefined,
                                                }}
                                            >
                                                {todo.text}
                                            </span>
                                            <InfoLine
                                                createdOn={todo.createdOn}
                                                onDelete={() => handleDeleteTodo(todos.indexOf(todo))}
                                                showConfirm={confirmIdx === idx}
                                                setShowConfirm={(v) => setConfirmIdx(v ? idx : null)}
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
                                className="flex items-center cursor-pointer border-b-zinc-300 p-2 hover:bg-zinc-700"
                                onClick={() => handleToggle(todos.indexOf(todo))}
                                title="Mark as incomplete"
                            >
                                <span className="line-through text-blue-300 flex-1">{todo.text}</span>
                                <span className="text-blue-300 text-sm ml-2">
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

function SortableItem({
    id,
    children,
    className,
    style,
    onTextClick,
    ...props
}: {
    id: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onTextClick: () => void;
} & React.HTMLAttributes<HTMLLIElement>) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <li
            ref={setNodeRef}
            style={{
                ...style,
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                cursor: "default",
                display: "flex",
                alignItems: "center",
            }}
            className={className}
            {...props}
        >
            {/* Drag handle */}
            <span
                {...listeners}
                {...attributes}
                className="cursor-grab mr-4 text-xl text-blue-300 select-none inline-flex items-center"
                tabIndex={0}
                aria-label="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
            >
                ≡
            </span>
            <span onClick={onTextClick} className={`flex-1 min-w-0 overflow-x-auto cursor-pointer`}>
                {children}
            </span>
        </li>
    );
}

export default ToDoList;
