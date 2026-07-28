import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

export function PlayerTabs() {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'discussion'>('overview');

  return (
    <div className="bg-white border border-primary-200 rounded-2xl shadow-sm overflow-hidden mb-12">
      {/* Tabs Header */}
      <div className="flex border-b border-primary-200 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'overview' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lesson</span>
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'resources' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Course Content</span>
          {activeTab === 'resources' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'discussion' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Course Content</span>
          {activeTab === 'discussion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
      </div>

      {/* Tabs Content */}
      <div className="p-6 md:p-8">
        {activeTab === 'overview' && (
          <div className="prose prose-slate prose-lg max-w-none text-primary-700">
            <h3 className="text-xl font-bold text-primary-900 mb-4">Lesson:</h3>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Course Content (Skin Barrier).</li>
              <li>Review lesson notes and supporting resources.</li>
              <li>Review lesson notes and supporting resources.</li>
            </ul>
            <p className="leading-relaxed">
              Use these resources to reinforce the lesson concepts.
            </p>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h3 className="text-xl font-bold text-primary-900 mb-6">Course Content</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-primary-200 hover:border-accent-500 hover:bg-accent-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-white group-hover:text-accent-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900 text-sm">Lesson (PDF)</h4>
                    <span className="text-xs text-primary-500">2.4 MB</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-primary-200 hover:border-accent-500 hover:bg-accent-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-white group-hover:text-accent-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900 text-sm">Course Content</h4>
                    <span className="text-xs text-primary-500">Links</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discussion' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary-900">Lesson</h3>
              <Button variant="secondary" className="text-sm px-4">Course Content</Button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                  Course Content
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-primary-900">Course Content</h4>
                    <span className="text-xs text-primary-400">Course Content</span>
                  </div>
                  <p className="text-primary-700 text-sm leading-relaxed mb-3">
                    Course Content
                  </p>

                  {/* Reply */}
                  <div className="flex gap-4 mt-3 bg-primary-50 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold flex-shrink-0">
                      Course Content
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-primary-900">Tutiba Learning Team <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full ml-2">Instructor</span></h4>
                        <span className="text-xs text-primary-400">Course Content</span>
                      </div>
                      <p className="text-primary-700 text-sm leading-relaxed">
                        Thanks for your question. An instructor will respond soon.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
