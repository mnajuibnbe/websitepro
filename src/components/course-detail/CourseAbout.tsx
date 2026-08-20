import React from 'react';
import { RichTextContent } from '../ui/RichTextContent';
import { Collapsible } from '../ui/Collapsible';

export function CourseAbout({ description }: { description: string | null }) {
  if (!description) return null;

  return (
    <section className="mb-12 md:mb-16" aria-labelledby="course-about-heading">
      <h2 id="course-about-heading" className="mb-6 text-2xl font-bold text-primary-900 md:text-3xl">About this course</h2>
      <Collapsible collapsedClassName="max-h-[220px]" fadeClassName="from-transparent via-transparent" className="max-w-3xl">
        <RichTextContent html={description} className="text-base text-primary-700 leading-relaxed [&_li]:pl-1" />
      </Collapsible>
    </section>
  );
}
