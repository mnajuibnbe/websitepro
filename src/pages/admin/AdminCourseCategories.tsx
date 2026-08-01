import { FormEvent, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Tags } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PageContainer } from '../../components/layout/PageContainer';
import { ToastContainer, type ToastMessage } from '../../components/ui/Toast';
import { useCourseCategories } from '../../hooks/useCourseCategories';
import { saveCourseCategory, type CourseCategory } from '../../services/courseCategories.service';

export function AdminCourseCategories() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { categories, isLoading, error, refetch } = useCourseCategories(true);
  const [drafts, setDrafts] = useState<Record<number, Pick<CourseCategory, 'name' | 'display_order' | 'is_active'>>>({});
  const [newName, setNewName] = useState('');
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = (type: ToastMessage['type'], message: string) => setToasts(current => [...current, { id: crypto.randomUUID(), type, message }]);

  const draftFor = (category: CourseCategory) => drafts[category.id] || category;
  const setDraft = (category: CourseCategory, values: Partial<Pick<CourseCategory, 'name' | 'display_order' | 'is_active'>>) => {
    setDrafts(current => ({ ...current, [category.id]: { ...draftFor(category), ...values } }));
  };

  const save = async (category: CourseCategory, override?: Partial<Pick<CourseCategory, 'name' | 'display_order' | 'is_active'>>) => {
    const draft = { ...draftFor(category), ...override };
    setSavingId(category.id);
    try {
      await saveCourseCategory({ id: category.id, ...draft });
      setDrafts(current => { const next = { ...current }; delete next[category.id]; return next; });
      toast('success', 'Category updated. Catalog filters now use the new settings.');
      refetch();
    } catch (saveError) {
      toast('error', saveError instanceof Error ? saveError.message : 'Unable to update the category.');
    } finally {
      setSavingId(null);
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setSavingId('new');
    try {
      const nextOrder = categories.length ? Math.max(...categories.map(category => category.display_order)) + 1 : 0;
      await saveCourseCategory({ name: newName.trim(), display_order: nextOrder, is_active: true });
      setNewName('');
      toast('success', 'Category added and published to the catalog.');
      refetch();
    } catch (saveError) {
      toast('error', saveError instanceof Error ? saveError.message : 'Unable to add the category.');
    } finally {
      setSavingId(null);
    }
  };

  const move = async (category: CourseCategory, direction: -1 | 1) => {
    const ordered = [...categories].sort((a, b) => a.display_order - b.display_order || a.id - b.id);
    const index = ordered.findIndex(item => item.id === category.id);
    const neighbor = ordered[index + direction];
    if (!neighbor) return;
    setSavingId(category.id);
    try {
      await saveCourseCategory({ id: category.id, name: category.name, display_order: neighbor.display_order, is_active: category.is_active });
      await saveCourseCategory({ id: neighbor.id, name: neighbor.name, display_order: category.display_order, is_active: neighbor.is_active });
      toast('success', 'Category order updated.');
      refetch();
    } catch (saveError) {
      toast('error', saveError instanceof Error ? saveError.message : 'Unable to reorder categories.');
    } finally {
      setSavingId(null);
    }
  };

  return <div className="min-h-screen bg-primary-50">
    <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
    <main id="main-content" className="pb-24 pt-20 lg:pl-72 lg:pt-8"><PageContainer>
      <header className="mb-7"><p className="text-sm font-bold text-accent-700">Catalog settings</p><h1 className="text-3xl font-bold text-primary-900">Course categories</h1><p className="mt-2 max-w-3xl text-primary-600">Manage the category names and order used by course forms, catalog shortcuts, and sidebar filters.</p></header>

      <form onSubmit={add} className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-bold text-primary-900">New category<input value={newName} onChange={event => setNewName(event.target.value)} maxLength={80} placeholder="Example: Clinical aesthetics" className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-primary-50 px-4 font-normal" /></label>
        <button type="submit" disabled={savingId !== null || !newName.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white disabled:opacity-50">{savingId === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add category</button>
      </form>

      {isLoading ? <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border bg-white p-16 text-primary-600"><Loader2 className="h-6 w-6 animate-spin text-accent-600" />Loading categories…</div>
        : error ? <div role="alert" className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center"><p className="font-bold text-danger-700">Categories could not be loaded.</p><button type="button" onClick={refetch} className="mt-3 font-bold text-accent-700">Try again</button></div>
          : categories.length === 0 ? <div className="rounded-2xl border border-dashed border-primary-300 bg-white p-12 text-center"><Tags className="mx-auto h-10 w-10 text-primary-300" /><h2 className="mt-3 font-bold text-primary-900">No categories yet</h2><p className="mt-1 text-sm text-primary-500">Add the first category above to make it available in course forms.</p></div>
            : <div className="space-y-3">{categories.map((category, index) => { const draft = draftFor(category); return <article key={category.id} className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${draft.is_active ? 'border-primary-200' : 'border-primary-200 opacity-75'}`}><div className="grid gap-4 lg:grid-cols-[minmax(15rem,1fr)_8rem_auto_auto] lg:items-end">
              <label className="text-sm font-bold text-primary-800">Name<input value={draft.name} onChange={event => setDraft(category, { name: event.target.value })} maxLength={80} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 px-3 font-normal" /></label>
              <label className="text-sm font-bold text-primary-800">Order<input type="number" min="0" value={draft.display_order} onChange={event => setDraft(category, { display_order: Math.max(0, Number(event.target.value) || 0) })} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 px-3 font-normal" /></label>
              <div className="flex items-center gap-1"><button type="button" disabled={index === 0 || savingId !== null} onClick={() => void move(category, -1)} aria-label={`Move ${category.name} up`} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary-200 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === categories.length - 1 || savingId !== null} onClick={() => void move(category, 1)} aria-label={`Move ${category.name} down`} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary-200 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>
              <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={savingId !== null} onClick={() => { const next = !draft.is_active; setDraft(category, { is_active: next }); void save(category, { is_active: next }); }} className={`min-h-11 rounded-xl border px-4 text-sm font-bold ${draft.is_active ? 'border-danger-200 text-danger-700' : 'border-success-200 text-success-700'}`}>{draft.is_active ? 'Deactivate' : 'Activate'}</button><button type="button" disabled={savingId !== null || !draft.name.trim()} onClick={() => void save(category)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-700 px-4 text-sm font-bold text-white disabled:opacity-50">{savingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</button></div>
            </div><p className="mt-3 text-xs text-primary-500">Slug: {category.slug} · {draft.is_active ? 'Visible in catalog and course forms' : 'Hidden from catalog and new course selections'}</p></article>; })}</div>}
    </PageContainer></main>
    <ToastContainer toasts={toasts} onDismiss={id => setToasts(current => current.filter(item => item.id !== id))} />
  </div>;
}
