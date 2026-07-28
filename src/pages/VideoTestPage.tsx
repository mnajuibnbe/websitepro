import React, { useState } from 'react';
import { VideoProviderResolver } from '../components/video/VideoProviderResolver';

export const VideoTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mp4' | 'youtube' | 'vimeo' | 'google_drive'>('mp4');

  const tabs = [
    { id: 'mp4', label: 'Direct MP4' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'vimeo', label: 'Vimeo' },
    { id: 'google_drive', label: 'Google Drive (Secure)' },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'mp4':
        return (
          <VideoProviderResolver
            lessonId="test-mp4"
            provider="mp4"
            videoUrl="https://files.vidstack.io/sprite-fight/720p.mp4"
            title="Sprite Fight (MP4 Test)"
          />
        );
      case 'youtube':
        return (
          <VideoProviderResolver
            lessonId="test-yt"
            provider="youtube"
            videoUrl="https://www.youtube.com/watch?v=1F3hm6MfR1k"
            title="Vidstack YouTube Test"
          />
        );
      case 'vimeo':
        return (
          <VideoProviderResolver
            lessonId="test-vi"
            provider="vimeo"
            videoUrl="https://vimeo.com/640499893"
            title="Vidstack Vimeo Test"
          />
        );
      case 'google_drive':
        return (
          <div className="space-y-4">
            <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md border border-amber-200">
              Note: Testing Google Drive requires a valid database `lessonId` mapped to a Google Drive video, and valid `Authorization` if required by the endpoint.
              This will likely fail unless the local DB has a lesson with ID "test-drive".
            </p>
            <VideoProviderResolver
              lessonId="test-drive"
              provider="google_drive"
              videoUrl="https://drive.google.com/file/d/invalid-for-test-only/view"
              title="Google Drive Test"
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pt-20">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Video Player Test Harness</h1>
        <p className="mt-2 text-sm text-gray-500">
          Phase 4A: Isolate and test video providers independently before LMS integration.
        </p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 max-w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black ring-opacity-5'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          {renderContent()}
        </div>
      </div>

      <div className="mt-12 bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Isolation Constraints</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
          <li>The VideoPlayer wrapper correctly isolates the @vidstack/react dependency.</li>
          <li>The VideoProviderResolver intelligently detects the provider and returns the appropriate component.</li>
          <li>SecureStreamProvider handles token negotiation for secure streams.</li>
          <li>None of these components are currently tied into LessonPlayer, maintaining Phase 4A strict isolation.</li>
        </ul>
      </div>
    </div>
  );
};
