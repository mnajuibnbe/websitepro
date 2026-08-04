import { useRef, useState } from 'react';
import { Loader2, MessageSquareText, Quote, RefreshCw, Star } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageTestimonials } from '../../hooks/useHomepageMarketing';
import type { HomepageTestimonial } from '../../lib/homepageMarketing';
import { Reveal } from '../ui/Reveal';

function TestimonialCard({ testimonial, mobile = false, featured = false }: { testimonial: HomepageTestimonial; mobile?: boolean; featured?: boolean }) {
  return <div className={`${mobile ? 'w-[85%] flex-none snap-center sm:w-[70%]' : ''} ${featured ? 'flex h-full flex-col rounded-2xl border border-primary-100 bg-primary-50 p-8 lg:p-10' : 'flex h-full w-[320px] flex-none snap-start flex-col rounded-2xl border border-primary-100 bg-white p-7'}`}>
    {featured && <Quote className="mb-4 h-8 w-8 text-accent-200" aria-hidden="true" />}
    {testimonial.source === 'platform' && testimonial.rating !== null ? <div className="mb-6 flex items-center gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-5 w-5 ${star <= testimonial.rating! ? 'fill-warning-500 text-warning-500' : 'text-primary-200'}`} />)}</div> : null}
    <p dir="auto" className={`mb-8 flex-grow leading-relaxed text-primary-800 ${featured ? 'text-lg font-medium' : 'text-base'}`}>“{testimonial.comment}”</p>
    <div className="mt-auto flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-200 text-lg font-bold text-primary-700">{testimonial.reviewer_name.charAt(0).toUpperCase()}</div><div><div className="font-bold text-primary-900">{testimonial.reviewer_name}</div><div className="text-sm font-medium text-primary-600">{testimonial.title}</div></div></div>
  </div>;
}

export function Testimonials() {
  const { data: testimonials, error, isLoading, refetch } = useHomepageTestimonials();
  const isLegacyCollection = testimonials.length > 0 && testimonials.every(testimonial => testimonial.source === 'legacy_import');
  const carouselRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const featured = testimonials.slice(0, 3);
  const more = testimonials.slice(3);

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

  return <section className="bg-white py-20 md:py-28"><PageContainer>
    <Reveal className="mb-14 text-center md:mb-16">
      <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Student Reviews</p>
      <h2 className="mt-3 font-display text-4xl font-semibold text-primary-900 md:text-5xl">What our students say</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-600">Real experiences from health professionals who developed their skills with Tutiba.</p>
    </Reveal>
    {isLoading && <div role="status" className="flex min-h-56 items-center justify-center text-primary-500"><Loader2 className="h-8 w-8 animate-spin" /><span className="sr-only">Loading student reviews</span></div>}
    {!isLoading && error && <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-primary-200 bg-primary-50 p-8 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-primary-300" /><h3 className="mt-4 text-xl font-bold text-primary-900">Reviews are temporarily unavailable</h3><p className="mt-2 text-primary-600">Please try again in a moment.</p><button type="button" onClick={refetch} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-300 px-4 font-bold text-primary-800 hover:bg-white"><RefreshCw className="h-4 w-4" /> Retry</button></div>}
    {!isLoading && !error && testimonials.length === 0 && <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-8 text-center md:p-10"><MessageSquareText className="mx-auto h-10 w-10 text-accent-500" /><h3 className="mt-4 text-xl font-bold text-primary-900">Student reviews are coming soon</h3><p className="mt-2 text-primary-600">Approved learner experiences will appear here as our community shares them.</p></div>}
    {!isLoading && !error && testimonials.length > 0 && <>
      {/* Mobile: single carousel of every testimonial */}
      <div ref={carouselRef} onScroll={updateActiveIndex} className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 md:hidden hide-scrollbar">{testimonials.map(testimonial => <TestimonialCard key={testimonial.review_id} testimonial={testimonial} mobile featured />)}</div>
      <div className="flex justify-center gap-2 md:hidden" aria-label="Testimonial slides">{testimonials.map((testimonial, index) => <button key={testimonial.review_id} type="button" aria-label={`Go to testimonial ${index + 1}`} aria-current={activeIndex === index ? 'true' : undefined} onClick={() => { const card = carouselRef.current?.children[index] as HTMLElement | undefined; card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }} className={`h-2.5 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-accent-600' : 'w-2.5 bg-primary-200'}`} />)}</div>

      {/* Desktop: 3 featured + horizontal carousel for the rest */}
      <div className={`hidden gap-6 md:grid lg:gap-8 ${featured.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
        {featured.map((testimonial, index) => <Reveal key={testimonial.review_id} delay={index * 0.08}><TestimonialCard testimonial={testimonial} featured /></Reveal>)}
      </div>
      {more.length > 0 && (
        <div className="relative mt-10 hidden md:block">
          <p className="mb-4 text-sm font-bold uppercase tracking-eyebrow text-primary-400">More from our students</p>
          <div ref={moreRef} className="flex snap-x gap-5 overflow-x-auto pb-4 hide-scrollbar">
            {more.map(testimonial => <TestimonialCard key={testimonial.review_id} testimonial={testimonial} />)}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-4 right-0 top-9 w-16 bg-gradient-to-l from-white to-transparent" />
        </div>
      )}
    </>}
    {!isLoading && !error && isLegacyCollection && <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-primary-500">These genuine testimonials were collected before Tutiba’s current review-submission and moderation system. New approved platform reviews will take their place here automatically.</p>}
  </PageContainer></section>;
}
