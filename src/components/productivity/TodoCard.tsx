import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ListChecks } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { PlayfulTodolist } from '../animate-ui/components/community/playful-todolist';
import { Tilt } from '../ui/tilt';
import { Spotlight } from '../ui/spotlight';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';
import { useAppStore } from '../../stores/appStore';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface TodoCardProps {
  id?: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  initialItems?: TodoItem[];
  onItemsChange?: (items: TodoItem[]) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotHeader?: React.ReactNode;
}

export function TodoCard({
  id = 'todo-node',
  title = 'Action Items',
  onTitleChange,
  initialItems = [
    { id: '1', text: 'Code in Assembly 💾', completed: true },
    { id: '2', text: 'Present a bug as a feature 🪲', completed: false },
    { id: '3', text: 'Push to prod on a Friday 🚀', completed: false },
  ],
  onItemsChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotHeader,
}: TodoCardProps) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const accentColor = useAppStore((s) => s.accentColor);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  const handleTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const toggleItem = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
    onItemsChange?.(updated);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false,
      priority,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setInputText('');
    onItemsChange?.(updated);
  };

  const deleteItem = (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    setItems(updated);
    onItemsChange?.(updated);
  };

  return (
    <Tilt
      rotationFactor={8}
      isRevese
      springOptions={{
        stiffness: 160,
        damping: 18,
        mass: 0.2,
      }}
      className="w-full h-full"
    >
      <div
        className={twMerge(
          'relative w-full h-full flex flex-col glass-vision-card rounded-2xl border border-white/10 overflow-hidden shadow-vision-elevated select-none transform-gpu will-change-transform font-sans',
          className
        )}
      >
        {/* Dynamic Specular Spotlight Glare */}
        <Spotlight
          className="from-white/30 via-white/10 to-transparent blur-2xl"
          size={280}
        />

        {/* Apple Frosted Header */}
        {slotHeader || (
        <div className="flex flex-col bg-white/5 border-b border-white/10 backdrop-blur-xl">
          <WindowHeader
            title={currentTitle}
            onTitleChange={handleTitleChange}
            icon={<ListChecks className="w-3.5 h-3.5 text-accent-green" />}
            onDelete={onDelete}
            onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
            isMinimized={isCollapsed}
            onMaximize={onMaximize}
            className="border-none bg-transparent"
          >
            <span className="text-[11px] font-mono text-white/60">
              {completedCount}/{items.length} Done
            </span>
          </WindowHeader>

          {/* Frosted Progress Bar */}
          <div className="w-full px-4 pb-2.5">
            <div className="w-full h-1.5 bg-black/20 dark:bg-black/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ backgroundColor: accentColor }}
                className="h-full rounded-full shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Playful Task List with hand-drawn wavy strikethrough & bouncy check */}
          <div
            className="flex-1 overflow-y-auto p-3 bg-black/30 backdrop-blur-md"
            onPointerDown={stopCanvasPropagation}
          >
            <PlayfulTodolist
              items={items}
              onToggleItem={(id) => toggleItem(String(id))}
              onDeleteItem={(id) => deleteItem(String(id))}
            />
          </div>

          {/* Input Form */}
          <form
            onSubmit={addItem}
            onPointerDown={stopCanvasPropagation}
            className="p-3 bg-black/40 dark:bg-black/60 border-t border-white/10 flex items-center gap-2 backdrop-blur-xl"
          >
            <input
              type="text"
              placeholder="Add new task..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') addItem(e);
              }}
              {...textInputProps}
              className="flex-1 px-3 py-1.5 text-xs bg-white/10 dark:bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 tracking-tight"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              {...interactiveProps}
              className="text-xs bg-neutral-900 dark:bg-black border border-white/15 text-white/80 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              onClick={(e) => {
                stopCanvasPropagation(e);
                addItem(e);
              }}
              style={{ backgroundColor: accentColor }}
              className="text-white h-8 px-3 rounded-xl shadow-sm hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>
        </>
      )}
      </div>
    </Tilt>
  );
}

export default TodoCard;
