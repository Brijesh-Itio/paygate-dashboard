import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', debounce = 400 }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => { if (localValue !== value) onChange(localValue); }, debounce);
    return () => clearTimeout(timer);
  }, [localValue]);

  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        className="input-field pl-9 pr-8"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button onClick={() => { setLocalValue(''); onChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
          <X size={13} />
        </button>
      )}
    </div>
  );
}
