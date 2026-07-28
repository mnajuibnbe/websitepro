import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, AlertCircle } from 'lucide-react';

interface NameConfirmationProps {
  onConfirm: (name: string) => void;
  defaultName: string;
}

export function NameConfirmation({ onConfirm, defaultName }: NameConfirmationProps) {
  const [name, setName] = useState(defaultName);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(name);
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-primary-200 rounded-2xl p-8 md:p-10 shadow-sm">
      <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mb-6">
        <User className="w-8 h-8 text-accent-600" />
      </div>

      <h2 className="text-2xl font-bold text-primary-900 mb-4">Certificate Name</h2>
      <p className="text-primary-600 mb-6 leading-relaxed">
        Confirm how your name should appear on your certificate.
      </p>

      <div className="mb-8">
        <label className="block text-sm font-bold text-primary-700 mb-2">Full Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-14 text-lg font-bold"
        />
        <div className="flex items-start gap-2 mt-3 text-warning-700 bg-warning-50 p-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="leading-snug">Enter your name exactly as you want it displayed. It cannot be changed after the certificate is issued.</span>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full h-14 text-lg font-bold"
        onClick={handleConfirm}
        disabled={name.trim().length < 3 || isProcessing}
      >
        {isProcessing ? 'Preparing Certificate...' : 'Confirm and Continue'}
      </Button>
    </div>
  );
}
