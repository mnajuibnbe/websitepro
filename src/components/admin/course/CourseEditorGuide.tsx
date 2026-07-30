import { Check, Circle } from 'lucide-react';

export interface CourseEditorStep {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

export function CourseEditorGuide({ steps }: { steps: CourseEditorStep[] }) {
  const complete = steps.filter(step => step.complete).length;
  const percentage = Math.round((complete / steps.length) * 100);
  return <nav aria-label="Course setup progress" className="mb-8 rounded-2xl border border-primary-200 bg-white p-4 shadow-2xs sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-primary-900">Course setup</p><p className="text-xs text-primary-500">Complete each section before building the curriculum.</p></div><span className="flex-none text-sm font-bold text-amber-700">{complete} of {steps.length}</span></div>
    <div className="mb-4 h-2 overflow-hidden rounded-full bg-primary-100" role="progressbar" aria-label="Course setup completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${percentage}%` }} /></div>
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <li key={step.id}><button type="button" onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex min-h-16 w-full items-start gap-2 rounded-xl border border-primary-100 p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 focus:ring-2 focus:ring-amber-500"><span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${step.complete ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-500'}`}>{step.complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}</span><span><span className="block text-sm font-bold text-primary-900">{index + 1}. {step.label}</span><span className="mt-0.5 block text-xs leading-snug text-primary-500">{step.description}</span></span></button></li>)}</ol>
  </nav>;
}
