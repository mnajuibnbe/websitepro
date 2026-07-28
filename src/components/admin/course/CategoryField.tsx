import { COURSE_CATEGORIES } from '../../../domain/courseTaxonomy';

export function CategoryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = COURSE_CATEGORIES.find(category => category.value === value);
  return <div><label htmlFor="course-category" className="mb-2 block text-sm font-bold text-primary-900">Category</label><select id="course-category" value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500"><option value="">Select a category</option>{COURSE_CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select><p className="mt-2 text-xs leading-relaxed text-primary-500">{selected?.description || 'Categories control where the course appears in the catalog and help students discover it.'}</p></div>;
}
