import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const start = ((page - 1) * limit) + 1;
  const end = Math.min(page * limit, total);

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  if (!total) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-700">
      <span className="text-xs text-slate-400">
        Showing <span className="text-white font-medium">{start}–{end}</span> of <span className="text-white font-medium">{total}</span> results
      </span>
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => onPageChange(1)} disabled={page === 1} title="First page"><ChevronsLeft size={14} /></NavBtn>
        <NavBtn onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Previous"><ChevronLeft size={14} /></NavBtn>
        {pages[0] > 1 && <span className="px-2 text-slate-500 text-xs">…</span>}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && <span className="px-2 text-slate-500 text-xs">…</span>}
        <NavBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} title="Next"><ChevronRight size={14} /></NavBtn>
        <NavBtn onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} title="Last page"><ChevronsRight size={14} /></NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ children, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
