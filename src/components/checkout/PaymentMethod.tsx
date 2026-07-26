import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { CreditCard, Wallet, Smartphone } from 'lucide-react';

export function PaymentMethod() {
  const [method, setMethod] = useState<'card' | 'paypal' | 'local'>('card');

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-primary-900 mb-6">Payment</h2>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <button
          onClick={() => setMethod('card')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'card' ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300'}`}
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <span className="text-sm font-bold">Payment Information</span>
        </button>
        <button
          onClick={() => setMethod('paypal')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'paypal' ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300'}`}
        >
          <Wallet className="w-6 h-6 mb-2" />
          <span className="text-sm font-bold">PayPal</span>
        </button>
        <button
          onClick={() => setMethod('local')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'local' ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300'}`}
        >
          <Smartphone className="w-6 h-6 mb-2" />
          <span className="text-sm font-bold">Save</span>
        </button>
      </div>

      {/* Card Payment Information */}
      {method === 'card' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-2">Payment Information</label>
            <div className="relative">
              <Input type="text" placeholder="0000 0000 0000 0000" className="w-full text-left pl-12" dir="ltr" />
              <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-bold text-primary-700 mb-2">Payment Information</label>
              <Input type="text" placeholder="MM/YY" className="w-full text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold text-primary-700 mb-2">Payment Information (CVC)</label>
              <Input type="text" placeholder="123" className="w-full text-left" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-2">Payment Information</label>
            <Input type="text" placeholder="MOHAMED AHMED" className="w-full text-left" dir="ltr" />
          </div>
        </div>
      )}

      {method === 'paypal' && (
        <div className="text-center py-8">
          <p className="text-primary-600 font-medium mb-4">Payment Information PayPal Payment.</p>
        </div>
      )}

      {method === 'local' && (
        <div className="text-center py-8">
          <p className="text-primary-600 font-medium mb-4">Please review the information and try again.</p>
          <Input type="text" placeholder="Enter details" className="w-full max-w-sm mx-auto text-center" dir="ltr" />
        </div>
      )}
    </div>
  );
}
