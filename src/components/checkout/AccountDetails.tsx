import React from 'react';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';

export function AccountDetails() {
  const { user } = useAuth();
  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-primary-900 mb-6">Account</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input type="text" label="Full name" value={user?.name || ''} readOnly className="w-full" />
        <Input type="email" label="Email address" value={user?.email || ''} readOnly className="w-full text-left" dir="ltr" />
      </div>
      <p className="text-sm text-primary-500 mt-4">
        Your order and enrollment will be linked to this account.
      </p>
    </div>
  );
}
