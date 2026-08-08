import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Trophy } from 'lucide-react';
import { FEATURE_FLAGS } from '../../config/featureFlags';

export function Achievements() {
  if (!FEATURE_FLAGS.certificates) {
    return null;
  }

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary-900">Achievements</h3>
        <Link to="/certificate" className="text-sm font-bold text-accent-600 hover:text-accent-700">Certificates</Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-l from-primary-50 to-white border border-primary-100">
          <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-1">Skin Care Foundations Certificate</h4>
            <p className="text-xs text-primary-500 font-medium">Completed 15 Details 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-50/50 border border-primary-100 opacity-70 grayscale">
          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-500 flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-1">Cosmeceutical Specialist Badge</h4>
            <p className="text-xs text-primary-500 font-medium">Complete the comprehensive diploma to unlock this badge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
