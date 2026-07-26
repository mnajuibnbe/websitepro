import React from 'react';
import { Input } from '../ui/Input';

export function AccountDetails() {
  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-primary-900 mb-6">Account</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-primary-700 mb-2">Full Name</label>
          <Input type="text" placeholder="Learn More: Learn More" className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-bold text-primary-700 mb-2">Email Address</label>
          <Input type="email" placeholder="example@email.com" className="w-full text-left" dir="ltr" />
        </div>
      </div>
      <p className="text-sm text-primary-500 mt-4">
        Build practical skills with structured, expert-led course content..
      </p>
    </div>
  );
}
