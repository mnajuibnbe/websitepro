import { useEffect } from 'react';
import { useCourseCategories } from '../../../hooks/useCourseCategories';

export function CategoryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { categories, isLoading, error } = useCourseCategories();
  const selected = categories.find(category => category.name === value);
  const missingCurrentValue = Boolean(value && !selected && !isLoading);

  useEffect(() => {
    if (!value && categories.length > 0) onChange(categories[0].name);
  }, [categories, onChange, value]);

  return <div><label htmlFor="course-category" className="mb-2 block text-sm font-bold text-primary-900">Category</label><select id="course-category" value={value} disabled={isLoading || Boolean(error)} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500 disabled:cursor-not-allowed disabled:opacity-60"><option value="">{isLoading ? 'Loading categories…' : 'Select a category'}</option>{missingCurrentValue && <option value={value} disabled>{value} (inactive)</option>}{categories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}</select><p className={`mt-2 text-xs leading-relaxed ${error ? 'font-bold text-danger-600' : 'text-primary-500'}`}>{error ? 'Categories could not be loaded. Try refreshing the page.' : selected?.description || (missingCurrentValue ? 'This category is inactive. Choose an active category before saving.' : 'Categories control where the course appears in the catalog and help students discover it.')}</p></div>;
}
