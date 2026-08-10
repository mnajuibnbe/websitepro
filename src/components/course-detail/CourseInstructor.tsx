import { Award, GraduationCap, UserRound } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';

export interface PublicInstructorProfile { professional_name: string; bio: string; expertise: string[]; credentials: string; avatar_url: string | null; }

export function CourseInstructor({ instructor }: { instructor: PublicInstructorProfile | null }) {
  const profileCopy = `${instructor?.bio || ''} ${instructor?.credentials || ''}`.toLowerCase();
  const containsApplicationGuidance = profileCopy.includes('add at least one expertise area')
    || profileCopy.includes('80-character biography')
    || profileCopy.includes('20 characters of credentials');
  const hasCompletePublicProfile = Boolean(
    instructor?.professional_name?.trim()
    && instructor.bio?.trim().length >= 80
    && instructor.credentials?.trim().length >= 20
    && Array.isArray(instructor.expertise)
    && instructor.expertise.some(item => item.trim())
    && !containsApplicationGuidance
  );

  if (!hasCompletePublicProfile) {
    return <section className="mb-12 md:mb-16" aria-labelledby="instructor-heading"><h2 id="instructor-heading" className="mb-6 text-2xl font-bold text-primary-900 md:text-3xl">Your instructor</h2><div className="rounded-2xl border border-primary-200 bg-primary-50 p-8 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-accent-700 shadow-sm"><UserRound className="h-9 w-9" /></div><h3 className="mt-5 text-xl font-bold text-primary-900">Instructor bio coming soon</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-primary-600">We’re preparing the instructor’s professional profile and will publish it here shortly.</p></div></section>;
  }

  return <section className="mb-12 md:mb-16" aria-labelledby="instructor-heading"><h2 id="instructor-heading" className="mb-6 text-2xl font-bold text-primary-900 md:text-3xl">Your instructor</h2><div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8"><div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">{instructor.avatar_url ? <div className="h-32 w-32 flex-none overflow-hidden rounded-full border-4 border-primary-50 shadow-md"><OptimizedImage src={instructor.avatar_url} alt={instructor.professional_name} displayWidth={320} width={320} height={320} className="h-full w-full object-cover" /></div> : <div className="flex h-32 w-32 flex-none items-center justify-center rounded-full bg-accent-50 text-accent-700"><UserRound className="h-14 w-14" /></div>}<div className="min-w-0 flex-1"><h3 className="text-2xl font-bold text-primary-900">{instructor.professional_name}</h3><p className="mt-2 leading-relaxed text-primary-600">{instructor.bio}</p><div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">{instructor.expertise.map(item => <span key={item} className="rounded-full bg-accent-50 px-3 py-1 text-sm font-bold text-accent-800">{item}</span>)}</div><div className="mt-5 flex items-start gap-3 rounded-xl bg-primary-50 p-4 text-left"><Award className="mt-0.5 h-5 w-5 flex-none text-warning-600" /><div><p className="font-bold text-primary-900">Professional credentials</p><p className="mt-1 text-sm leading-relaxed text-primary-600">{instructor.credentials}</p></div></div><p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-success-700"><GraduationCap className="h-4 w-4" />Admin-approved instructor</p></div></div></div></section>;
}
