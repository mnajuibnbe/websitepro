import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useAuth } from '../../contexts/AuthContext';

interface SecureStreamProviderProps {
  lessonId: string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
}

export const SecureStreamProvider: React.FC<SecureStreamProviderProps> = ({ lessonId, title, poster, onEnded }) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    console.log("[DevLog] SecureStreamProvider lessonId:", typeof lessonId, lessonId);
    let isMounted = true;
    
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[DevLog] Token requested for lessonId: ${lessonId}`);
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ lessonId })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to get streaming token');
        }
        
        const data = await response.json();
        console.log(`[DevLog] Token received: ${data.token.substring(0, 10)}...`);
        
        if (isMounted) {
          // Construct stream URL
          const url = `/api/video/stream?token=${data.token}`;
          setStreamUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`[DevLog] Stream error:`, err);
          setError(err.message || 'An unexpected error occurred');
          setLoading(false);
        }
      }
    };
    
    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, [lessonId, token]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white text-sm font-medium">Authorizing secure stream...</p>
        </div>
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Streaming Error</h3>
          <p className="text-slate-400 text-sm mb-6">{error || 'Failed to initialize stream.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <VideoPlayer src={streamUrl} title={title} poster={poster} onEnded={onEnded} autoPlay={true} />;
};
