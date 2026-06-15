import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
          <AlertCircle size={36} className="text-slate-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-700 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page not found</h2>
        <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2 mx-auto">
          <Home size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
