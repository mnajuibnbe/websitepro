import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Save, TrendingUp } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Values = { studentsValue: string; coursesValue: string; learningHoursValue: string };
const INITIAL_VALUES: Values = { studentsValue: '1,000+', coursesValue: '8+', learningHoursValue: '200+' };
const VALUE_PATTERN = /^[0-9][0-9,]*\+?$/;

export function AdminHomepageSettings() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_marketing_settings').select('students_value,courses_value,learning_hours_value').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage({ kind: 'error', text: 'Homepage statistics could not be loaded.' });
        else setValues({ studentsValue: data.students_value, coursesValue: data.courses_value, learningHoursValue: data.learning_hours_value });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const submittedValues = [values.studentsValue, values.coursesValue, values.learningHoursValue];
    if (submittedValues.some(value => !VALUE_PATTERN.test(value) || value.length > 12)) {
      setMessage({ kind: 'error', text: 'Use numbers, commas, and an optional plus sign only (for example, 1,000+).' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('homepage_marketing_settings').update({
      students_value: values.studentsValue,
      courses_value: values.coursesValue,
      learning_hours_value: values.learningHoursValue,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error
      ? { kind: 'error', text: 'The homepage statistics could not be saved.' }
      : { kind: 'success', text: 'Homepage statistics updated.' });
  };

  return (
    <div className="min-h-screen bg-primary-50" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main id="main-content" className="pb-24 pt-20 transition-all lg:pl-72 lg:pt-8">
        <PageContainer>
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Homepage</p>
              <h1 className="mt-2 text-3xl font-bold text-primary-900">Marketing statistics</h1>
              <p className="mt-2 text-primary-600">Manage the historical totals shown below the hero. These values are intentionally separate from live database counts.</p>
            </div>

            <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><TrendingUp className="h-5 w-5" /></div>
                <div><h2 className="font-bold text-primary-900">Public figures</h2><p className="text-sm text-primary-500">The labels remain fixed so the layout stays consistent.</p></div>
              </div>

              {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
                <div className="grid gap-5 sm:grid-cols-3">
                  <StatField id="students-value" label="Students taught" value={values.studentsValue} onChange={studentsValue => setValues(current => ({ ...current, studentsValue }))} />
                  <StatField id="courses-value" label="Courses delivered" value={values.coursesValue} onChange={coursesValue => setValues(current => ({ ...current, coursesValue }))} />
                  <StatField id="hours-value" label="Hours of learning" value={values.learningHoursValue} onChange={learningHoursValue => setValues(current => ({ ...current, learningHoursValue }))} />
                </div>
              )}

              {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
              <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save statistics</Button></div>
            </form>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}

function StatField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-primary-800">{label}</label><input id={id} value={value} onChange={event => onChange(event.target.value)} maxLength={12} inputMode="numeric" className="h-14 w-full rounded-xl border border-primary-200 bg-primary-50 px-4 text-xl font-bold text-primary-900 focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>;
}
