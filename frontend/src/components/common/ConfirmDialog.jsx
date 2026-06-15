import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-900/40' : 'bg-amber-900/40'}`}>
          <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-amber-400'} />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1 text-sm" disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${danger ? 'btn-danger' : 'btn-primary'}`}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
