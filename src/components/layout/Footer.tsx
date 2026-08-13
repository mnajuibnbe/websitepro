import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Globe, Mail, Microscope, RefreshCw, ShieldCheck } from 'lucide-react';
import { TutibaBrand } from './TutibaBrand';
import { PageContainer } from './PageContainer';

const trustLine = [
  { label: 'Evidence-based curriculum', icon: Microscope },
  { label: 'Lifetime course access', icon: RefreshCw },
  { label: 'Secure checkout', icon: ShieldCheck },
];

export function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title);
  };

  const footerLinks = [
    { title: 'Courses', links: [
      { label: 'All Courses', href: '/courses' },
      { label: 'Free Lessons', href: '/courses?price=free' },
    ] },
    { title: 'Tutiba', links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Learning Method', href: '/about' },
      { label: 'Our Instructors', href: '/about' },
    ] },
    { title: 'Resources', links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Scientific Articles', href: '/blog' },
    ] },
    { title: 'Support', links: [
      { label: 'Help Center', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Frequently Asked Questions', href: '/faq' },
      { label: 'Technical Support', href: '/contact' },
    ] },
    { title: 'Legal', links: [
      { label: 'Terms and Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ] },
  ];

  return (
    <footer className="bg-primary-900 text-primary-300 pt-20 md:pt-28 pb-8 border-t-4 border-accent-600">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-14">

          {/* Logo & Brand Message */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
            <TutibaBrand inverted className="mb-6" />
            <p className="text-primary-400 leading-relaxed max-w-sm mb-8 text-sm md:text-base">
              Evidence-based learning for health professionals who want to build practical confidence in cosmeceuticals.
            </p>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-primary-700 px-4 py-2.5 font-semibold text-primary-200 transition-colors hover:border-accent-500 hover:text-white"><Mail className="h-4 w-4" aria-hidden="true" />Contact support</Link>
          </div>

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden lg:grid lg:grid-cols-5 lg:col-span-8 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-white font-bold mb-6 text-lg">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="hover:text-accent-400 transition-colors font-medium text-primary-400 block hover:translate-x-1 duration-200 transform">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordions (Hidden on Desktop) */}
          <div className="block lg:hidden space-y-2 lg:col-span-8">
            {footerLinks.map((section) => (
              <div key={section.title} className="border-b border-primary-800">
                <button
                  onClick={() => toggleAccordion(section.title)}
                  type="button"
                  aria-expanded={openAccordion === section.title}
                  aria-controls={`footer-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="w-full flex items-center justify-between py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-accent-500 rounded px-2"
                >
                  <span className="text-lg">{section.title}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openAccordion === section.title ? 'rotate-180 text-accent-400' : 'text-primary-500'}`} />
                </button>
                <div
                  id={`footer-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === section.title ? 'max-h-64 mb-4 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="space-y-3 pt-2 pb-4 px-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.href} className="text-primary-400 hover:text-accent-400 font-medium block py-2">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-primary-800 py-8 lg:justify-start">
          {trustLine.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-semibold text-primary-300">
              <Icon className="h-4 w-4 text-accent-400" aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-primary-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="order-2 text-center text-sm text-primary-500 md:order-1 md:text-left">© {new Date().getFullYear()} Tutiba. All rights reserved.</span>

          <div className="order-1 flex items-center gap-2 rounded-full bg-primary-800 px-3 py-1.5 md:order-2" aria-label="Site language: English">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">English</span>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
