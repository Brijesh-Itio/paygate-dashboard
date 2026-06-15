import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/UI';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const fields = [
    { icon: User, label: 'Full Name', value: user.name },
    { icon: Mail, label: 'Email Address', value: user.email },
    { icon: Shield, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    { icon: Calendar, label: 'Last Login', value: user.lastLogin ? formatDate(user.lastLogin) : 'N/A' },
  ];

  return (
    <div className="space-y-5 max-w-lg">
      <PageHeader title="My Profile" description="Your account information" />
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
