const clean = (value?: string | null) => (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value: string, limit: number) => value.length <= limit ? value : `${value.slice(0, limit - 1).replace(/\s+\S*$/, '')}…`;

export interface CourseSeoInput { title?: string | null; shortDescription?: string | null; description?: string | null; category?: string | null }

export function generateCourseSeo(input: CourseSeoInput) {
  const title = clean(input.title) || 'Professional online course';
  const category = clean(input.category);
  const source = clean(input.shortDescription) || clean(input.description) || `Build practical, evidence-based skills with this ${category || 'professional'} online course from Tutiba.`;
  return {
    title: truncate(`${title} | Tutiba`, 60),
    description: truncate(source, 160),
  };
}
