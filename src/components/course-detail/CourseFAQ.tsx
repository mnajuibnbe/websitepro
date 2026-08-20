import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { courseLanguageLabel } from '../../lib/externalProof';

interface FaqEntry { question: string; answer: string; }

export function CourseFAQ({ language, hasPreviewMedia, requirements }: { language: string | null; hasPreviewMedia: boolean; requirements: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const languageLabel = courseLanguageLabel(language);
  const visibleRequirements = requirements.map(item => item.trim()).filter(Boolean);

  const entries: FaqEntry[] = [
    {
      question: 'What language is this course taught in?',
      answer: languageLabel
        ? `The course is taught in ${languageLabel.replace(' course', '')}. Ingredient names, scientific terms and commonly used professional terminology are kept in English where appropriate.`
        : 'Ingredient names, scientific terms and commonly used professional terminology are kept in English where appropriate.',
    },
    ...(hasPreviewMedia ? [{
      question: 'Can I preview lessons before I enroll?',
      answer: 'Yes. Selected lessons inside the course are available as previews so you can see the teaching style and course quality before enrolling.',
    }] : []),
    {
      question: 'How long do I keep access?',
      answer: 'You get lifetime access to the course once enrolled — learn at your own pace, on your own schedule.',
    },
    {
      question: 'Can I watch on my phone?',
      answer: 'Yes, the course works in any modern mobile or desktop browser — no app installation required.',
    },
    ...(visibleRequirements.length > 0 ? [{
      question: 'Do I need previous experience?',
      answer: `Before you start: ${visibleRequirements.join('; ')}.`,
    }] : []),
    {
      question: 'What payment methods can I use?',
      answer: 'Pay by bank transfer, InstaPay, or Vodafone Cash — no card required.',
    },
  ];

  return (
    <section className="mb-12 md:mb-16" aria-labelledby="course-faq-heading">
      <h2 id="course-faq-heading" className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Course FAQ</h2>
      <div className="divide-y divide-primary-200 rounded-panel border border-primary-200 bg-white shadow-sm">
        {entries.map((entry, index) => {
          const open = openIndex === index;
          return (
            <div key={entry.question}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left font-bold text-primary-900 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500"
              >
                <span>{entry.question}</span>
                <ChevronDown aria-hidden="true" className={`h-5 w-5 flex-none text-primary-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && <div id={`faq-answer-${index}`} className="px-5 pb-5 text-primary-600 leading-relaxed">{entry.answer}</div>}
            </div>
          );
        })}
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-2">
          <Link to="/faq" className="font-bold text-accent-700 hover:text-accent-800">View all questions</Link>
          <Link to="/refund-policy" className="font-bold text-accent-700 hover:text-accent-800">Refund policy</Link>
        </div>
      </div>
    </section>
  );
}
