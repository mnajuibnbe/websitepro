import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchContinueLearningTarget, type ContinueLearningTarget } from '../../lib/courseProgress';
import { ContinueLearningCard } from './ContinueLearningCard';

export function ContinueLearning() {
  const { user } = useAuth();

  const [target, setTarget] = useState<ContinueLearningTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setHasError(false);
        if (user?.id) {
          const result = await fetchContinueLearningTarget(user.id);
          setTarget(result);
        }
      } catch (e) {
        console.error(e);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.id) {
      load();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white border border-danger-200 rounded-2xl p-8 text-danger-600 font-bold">
        Unable to load your learning progress right now.
      </div>
    );
  }

  if (!target) {
    return null;
  }

  return <ContinueLearningCard target={target} />;
}
