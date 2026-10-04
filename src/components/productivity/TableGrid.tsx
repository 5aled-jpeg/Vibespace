import React, { useState } from 'react';
import { Plus, Trash2, Download, Table as TableIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '../primitives/Button';
import WindowHeader from '../layout/WindowHeader';
import { stopCanvasPropagation, interactiveProps, textInputProps } from '../../utils/canvas-events';
import { useAppStore } from '../../stores/appStore';

export interface TableGridProps {
  id?: string;
  initialHeaders?: string[];
  initialRows?: string[][];
  title?: string;
  onDataChange?: (headers: string[], rows: string[][]) => void;
  onDelete?: () => void;
  onMaximize?: () => void;
  onToggleMinimize?: () => void;
  className?: string;
  slotHeader?: React.ReactNode;
}

export function TableGrid({
  id = 'table-node',
  initialHeaders = ['Item', 'Category', 'Quantity', 'Status'],
  initialRows = [
    ['Workspace Architecture', 'Engineering', '1', 'Done'],
    ['tldraw Custom Shapes', 'Canvas', '7', 'In Progress'],
    ['LiveKit Drift Sync', 'Realtime', '1', 'Review'],
    ['Monaco Sandbox', 'Code Runner', '1', 'Done'],
  ],
  title = 'Project Data Grid',
  onDataChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
  className,
  slotHeader,
}: TableGridProps) {
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [rows, setRows] = useState<string[][]>(initialRows);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const accentColor = useAppStore((s) => s.accentColor);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const updated = rows.map((r, rIdx) =>
      rIdx === rowIndex ? r.map((c, cIdx) => (cIdx === colIndex ? value : c)) : r
    );
    setRows(updated);
    onDataChange?.(headers, updated);
  };

  const updateHeader = (colIndex: number, value: string) => {
    const updated = headers.map((h, idx) => (idx === colIndex ? value : h));
    setHeaders(updated);
    onDataChange?.(updated, rows);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill('');
    const updated = [...rows, newRow];
    setRows(updated);
    onDataChange?.(headers, updated);
  };

  const addColumn = () => {
    const newColName = `Col ${headers.length + 1}`;
    const newHeaders = [...headers, newColName];
    const newRows = rows.map((r) => [...r, '']);
    setHeaders(newHeaders);
    setRows(newRows);
    onDataChange?.(newHeaders, newRows);
  };

  const deleteRow = (rowIndex: number) => {
    const updated = rows.filter((_, idx) => idx !== rowIndex);
    setRows(updated);
    onDataChange?.(headers, updated);
  };

  const exportCsv = () => {
    const lines = [
      headers.join(','),
      ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={twMerge(
        'w-full h-full flex flex-col glass-vision-card rounded-2xl border border-white/10 overflow-hidden shadow-vision-elevated select-none transform-gpu will-change-transform font-sans',
        className
      )}
    >
      {/* Apple Frosted Header */}
      {slotHeader || (
        <WindowHeader
          title={title}
          icon={<TableIcon className="w-3.5 h-3.5 text-accent-amber" />}
          onDelete={onDelete}
          onToggleMinimize={onToggleMinimize || (() => setIsCollapsed(!isCollapsed))}
          isMinimized={isCollapsed}
          onMaximize={onMaximize}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={addColumn}
            className="text-xs py-1 px-2.5 h-7 rounded-lg text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <Plus className="w-3 h-3 mr-1" /> Col
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addRow}
            className="text-xs py-1 px-2.5 h-7 rounded-lg text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <Plus className="w-3 h-3 mr-1" /> Row
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={exportCsv}
            className="h-7 w-7 rounded-lg text-white/70 hover:text-white"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </WindowHeader>
      )}

      {/* Grid Container */}
      {!isCollapsed && (
        <div
          className="flex-1 overflow-auto bg-slate-100/40 dark:bg-black/40 p-3"
          onPointerDown={stopCanvasPropagation}
        >
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-200/50 dark:bg-white/5">
                <th className="p-2 w-8 text-center text-slate-400 dark:text-white/40 font-mono text-[10px]">#</th>
                {headers.map((head, cIdx) => (
                  <th key={cIdx} className="p-1.5 min-w-[120px]">
                    <input
                      type="text"
                      value={head}
                      onChange={(e) => updateHeader(cIdx, e.target.value)}
                      {...textInputProps}
                      className="w-full bg-transparent font-semibold text-slate-800 dark:text-white/80 px-2 py-1 rounded-lg focus:bg-black/5 dark:focus:bg-white/10 focus:outline-none tracking-tight"
                    />
                  </th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-200/30 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-2 text-center text-slate-400 dark:text-white/35 font-mono text-[10px]">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        {...textInputProps}
                        className="w-full bg-transparent text-slate-800 dark:text-white/90 px-2 py-1 rounded-lg focus:bg-black/5 dark:focus:bg-white/10 focus:outline-none focus:ring-1 tracking-tight"
                        style={{ outlineColor: accentColor }}
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      {...interactiveProps}
                      onClick={(e) => {
                        stopCanvasPropagation(e);
                        deleteRow(rIdx);
                      }}
                      className="text-white/30 hover:text-accent-red p-1 rounded transition-colors cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TableGrid;
