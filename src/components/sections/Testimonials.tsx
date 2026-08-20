import { useRef, useState } from 'react';
import { Loader2, MessageSquareText, RefreshCw, Star } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageTestimonials } from '../../hooks/useHomepageMarketing';
import type { HomepageTestimonial } from '../../lib/homepageMarketing';
import { Reveal } from '../ui/Reveal';

function TestimonialCard({ testimonial, mobile = false }: { testimonial: HomepageTestimonial; mobile?: boolean }) {
  return <div className={`flex h-full flex-col rounded-panel border border-primary-200 bg-white p-6 shadow-sm ${mobile ? 'w-[85%] flex-none snap-center sm:w-[70%]' : ''}`}>
    {testimonial.source === 'platform' && testimonial.rating !== null ? <div className="mb-3 flex items-center gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= testimonial.rating! ? 'fill-warning-500 text-warning-500' : 'text-primary-200'}`} />)}</div> : null}
    <p dir="auto" className="mb-5 line-clamp-4 flex-grow text-sm leading-relaxed text-primary-800">“{testimonial.comment}”</p>
    <div className="mt-auto flex items-center gap-3"><div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-200 text-sm font-bold text-primary-700">{testimonial.reviewer_name.charAt(0).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-primary-900">{testimonial.reviewer_name}</div><div className="truncate text-xs font-medium text-primary-500">{testimonial.title}</div></div></div>
  </div>;
}

export function Testimonials() {
  const { data: testimonials, error, isLoading, refetch } = useHomepageTestimonials();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const featured = testimonials.slice(0, 3);

  const updateActiveIndex = () => {
    const container = carouselRef.current;
    if (!container) return;
    const cards = [...container.children] as HTMLElement[];
    const center = container.scrollLeft + container.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const nextDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (nextDistance < distance) { nearest = index; distance = nextDistance; }
    });
    setActiveIndex(nearest);
  };

  return <section className="bg-white py-10 md:py-12"><PageContainer>
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">Student Reviews</p>
      <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">What students say after taking the courses</h2>
    </Reveal>
    {isLoading && <div role="status" className="flex min-h-40 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading student reviews</span></div>}
    {!isLoading && error && <div role="alert" className="mx-auto max-w-xl rounded-panel border border-primary-200 bg-primary-50 p-6 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-primary-300" aria-hidden="true" /><h3 className="mt-3 text-lg font-bold text-primary-900">Reviews are temporarily unavailable</h3><p className="mt-1 text-primary-600">Please try again in a moment.</p><button type="button" onClick={refetch} className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-primary-300 px-4 font-bold text-primary-800 transition-colors duration-200 ease-out hover:border-primary-400 hover:bg-white"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry</button></div>}
    {!isLoading && !error && testimonials.length === 0 && <div className="mx-auto max-w-xl rounded-panel border border-dashed border-primary-300 bg-primary-50 p-6 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-accent-500" /><h3 className="mt-3 text-lg font-bold text-primary-900">Student reviews are coming soon</h3><p className="mt-1 text-primary-600">Approved learner experiences will appear here as our community shares them.</p></div>}
    {!isLoading && !error && testimonials.length > 0 && <>
      {/* Mobile: swipeable carousel of the top reviews */}
      <div ref={carouselRef} onScroll={updateActiveIndex} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:hidden hide-scrollbar">{featured.map(testimonial => <TestimonialCard key={testimonial.review_id} testimonial={testimonial} mobile />)}</div>
      <div className="flex justify-center gap-2 md:hidden" aria-label="Testimonial slides">{featured.map((testimonial, index) => {
        const isActive = activeIndex === index;
        return <button key={testimonial.review_id} type="button" aria-label={`Go to testimonial ${index + 1}`} aria-current={isActive ? 'true' : undefined} onClick={() => { const card = carouselRef.current?.children[index] as HTMLElement | undefined; card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }} className={`flex h-11 w-11 -my-[17px] cursor-pointer items-center justify-center ${isActive ? '-mx-2' : '-mx-[17px]'}`}>
          <span aria-hidden="true" className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out ${isActive ? 'w-7 bg-accent-600' : 'w-2.5 bg-primary-300'}`} />
        </button>;
      })}</div>

      {/* Desktop: top 3 reviews only — quick social proof, not a wall of testimonials */}
      <div className={`hidden gap-5 md:grid ${featured.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {featured.map((testimonial, index) => <Reveal key={testimonial.review_id} delay={index * 0.06} className="h-full"><TestimonialCard testimonial={testimonial} /></Reveal>)}
      </div>
    </>}
  </PageContainer></section>;
}
