import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export function DailyReview() {
  const tasks = [
    { id: 1, title: 'Lesson', completed: true },
    { id: 2, title: 'Section', completed: false },
    { id: 3, title: 'Details: Details (Details)', completed: false },
  ];

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary-900">Tasks and Review</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent-100 text-accent-700">
          Details
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <label key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors group">
            <div className="mt-0.5 flex-shrink-0">
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              ) : (
                <Circle className="w-5 h-5 text-primary-300 group-hover:text-accent-500 transition-colors" />
              )}
            </div>
            <span className={`text-sm font-medium leading-snug ${task.completed ? 'text-primary-400 line-through' : 'text-primary-800'}`}>
              {task.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
