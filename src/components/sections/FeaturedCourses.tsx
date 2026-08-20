import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Loader2, PlayCircle, RefreshCw, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { OptimizedImage } from '../ui/OptimizedImage';
import { usePricingContext } from '../../contexts/PricingContext';
import { PageContainer } from '../layout/PageContainer';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { mapCourseToCardProps } from '../../lib/courseCard';
import type { CourseCatalogItem } from '../../services/courseCatalog.service';
import type { PricingContext } from '../../lib/pricing';
import { Reveal } from '../ui/Reveal';

/** A deliberately more compact homepage card than `CourseCard` (the shared /courses listing
 * card) — same real data via `mapCourseToCardProps`, tighter proportions to match the
 * homepage's denser layout without touching the shared component other pages depend on. */
function CompactCourseCard({ course, pricingContext, onEnroll }: { course: CourseCatalogItem; pricingContext: PricingContext; onEnroll: () => void }) {
  const card = mapCourseToCardProps(course, pricingContext);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-panel border border-primary-200 bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-primary-100">
        <OptimizedImage src={card.imageUrl} alt={card.title} displayWidth={500} width="500" height="281" priority className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <Badge variant="accent" className="shadow-sm">{card.category}</Badge>
          {card.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-primary-900 shadow-sm">
              <Star className="h-3 w-3 fill-current text-warning-500" /> {card.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-grow flex-col p-5">
        <h3 className="text-base font-bold text-primary-900">{card.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-primary-600">{card.description}</p>

        <div className="mb-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-primary-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{card.duration}</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{card.lessonsCount} lessons</span>
          <span className="flex items-center gap-1 text-accent-700"><PlayCircle className="h-3.5 w-3.5" />Preview available</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-primary-100 pt-3">
          <span className="text-lg font-bold text-primary-900">{card.price}</span>
          <Button variant="primary" className="h-10 px-4 text-sm" onClick={onEnroll}>View Course</Button>
        </div>
      </div>
    </article>
  );
}

export function FeaturedCourses() {
  const navigate = useNavigate();
  const pricingContext = usePricingContext();
  const { courses, isLoading, error, refetch } = useCourseCatalog({
    pageSize: 3,
    pricingContext,
    sort: 'featured',
  });

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-primary-50 py-10 md:py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 bg-primary-50 py-10 md:py-12">
        <p className="font-bold text-danger-600">Unable to load featured courses. Please try again.</p>
        <Button variant="secondary" onClick={refetch} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
        </Button>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="bg-primary-50 py-10 md:py-12">
      <PageContainer>

        {/* Section Header */}
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">Courses</p>
          <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">
            Start with the course that fits you.
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-primary-600">
            Learn at your own pace, preview selected lessons first, and keep access to your course after you enroll.
          </p>
        </Reveal>

        {/* Courses Grid */}
        <div className={`mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 ${courses.length < 3 ? 'mx-auto max-w-3xl' : 'lg:grid-cols-3'}`}>
          {courses.map((course, index) => (
            <Reveal key={course.id} delay={index * 0.06} className="h-full">
              <CompactCourseCard course={course} pricingContext={pricingContext} onEnroll={() => navigate(`/course/${course.id}`)} />
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            View All Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}
