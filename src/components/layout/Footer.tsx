import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Droplet, ChevronDown, Facebook, Twitter, Instagram, Linkedin, Globe } from 'lucide-react';

export function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title);
  };

  const footerLinks = [
    {
      title: 'الدورات',
      links: [
        { label: 'دبلومة العناية بالبشرة', href: '#/courses' },
        { label: 'دبلومة العناية بالشعر', href: '#/courses' },
        { label: 'كورسات متخصصة', href: '#/courses' },
        { label: 'الدروس المجانية', href: '#/courses' }
      ]
    },
    {
      title: 'الشركة',
      links: [
        { label: 'عن المنصة', href: '#/about' },
        { label: 'د. آية البراشي', href: '#/about' },
        { label: 'منهجيتنا', href: '#/about' },
        { label: 'قصص نجاح', href: '#/' }
      ]
    },
    {
      title: 'الموارد',
      links: [
        { label: 'المدونة', href: '#/blog' },
        { label: 'قاموس المكونات', href: '#/blog' },
        { label: 'تحليل المنتجات', href: '#/blog' },
        { label: 'أدوات مجانية', href: '#/blog' }
      ]
    },
    {
      title: 'الدعم',
      links: [
        { label: 'مركز المساعدة', href: '#/faq' },
        { label: 'تواصل معنا', href: '#/contact' },
        { label: 'الأسئلة الشائعة', href: '#/faq' },
        { label: 'واتساب', href: '#/contact' }
      ]
    },
    {
      title: 'القانونية',
      links: [
        { label: 'شروط الاستخدام', href: '#/terms' },
        { label: 'سياسة الخصوصية', href: '#/privacy' },
        { label: 'سياسة الاسترجاع', href: '#/terms' }
      ]
    }
  ];

  return (
    <footer className="bg-primary-900 text-primary-300 pt-16 md:pt-24 pb-8 border-t-4 border-accent-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Logo & Brand Message */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-right">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center justify-center text-accent-400">
                 <FlaskConical className="w-10 h-10" strokeWidth={1.5} />
                 <Droplet className="w-4 h-4 absolute bottom-0 right-0 text-accent-300 fill-current" />
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-2xl tracking-tight text-white leading-none font-sans uppercase">TUTIBA</span>
                <span className="text-[10px] text-primary-400 font-medium tracking-widest uppercase">Cosmeceutical Education</span>
              </div>
            </div>
            <p className="text-primary-400 leading-relaxed max-w-sm mb-8 text-sm md:text-base">
              المرجع العلمي العربي الأول في الكوسميسوتيكال للمهنيين الصحيين. نبني ثقتك العلمية بأسس تطبيقية دقيقة.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-400 hover:bg-accent-600 hover:text-white transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link to="/" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-400 hover:bg-accent-600 hover:text-white transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link to="/" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-400 hover:bg-accent-600 hover:text-white transition-all duration-300 hover:-translate-y-1" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link to="/" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-400 hover:bg-accent-600 hover:text-white transition-all duration-300 hover:-translate-y-1" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden lg:grid lg:grid-cols-5 lg:col-span-8 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-white font-bold mb-6 text-lg">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="hover:text-accent-400 transition-colors font-medium text-primary-400 block hover:-translate-x-1 duration-200 transform">{link.label}</a>
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
                  className="w-full flex items-center justify-between py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-accent-500 rounded px-2"
                >
                  <span className="text-lg">{section.title}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openAccordion === section.title ? 'rotate-180 text-accent-400' : 'text-primary-500'}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === section.title ? 'max-h-64 mb-4 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="space-y-3 pt-2 pb-4 px-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className="text-primary-400 hover:text-accent-400 font-medium block py-2">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-primary-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-primary-500 order-2 md:order-1 text-center md:text-right">
            <span>© {new Date().getFullYear()} Tutiba. جميع الحقوق محفوظة.</span>
            <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors bg-primary-800 px-3 py-1.5 rounded-full">
              <Globe className="w-4 h-4" />
              <span className="font-medium">العربية</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 order-1 md:order-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
             {/* Payment Methods placeholders */}
             <div className="h-8 w-12 bg-primary-800 rounded flex items-center justify-center text-xs font-bold text-primary-400">Visa</div>
             <div className="h-8 w-12 bg-primary-800 rounded flex items-center justify-center text-xs font-bold text-primary-400">MC</div>
             <div className="h-8 w-16 bg-primary-800 rounded flex items-center justify-center text-xs font-bold text-primary-400">PayPal</div>
             <div className="h-8 w-16 bg-primary-800 rounded flex items-center justify-center text-xs font-bold text-primary-400">V-Cash</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
