import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4" dir="ltr">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-100 p-8 text-center">
        <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-danger-500" />
        </div>

        <h1 className="text-3xl font-bold text-primary-900 mb-4">Access Denied</h1>
        <p className="text-primary-600 mb-8 leading-relaxed">
          You do not have permission to access this page. Return to your dashboard or contact an administrator.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>Student Dashboard</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Back</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
