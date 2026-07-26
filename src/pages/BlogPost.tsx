import React, { useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowRight, Calendar, User, ChevronRight } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function BlogPost() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8">
            <Link to="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="hover:text-accent-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }} className="hover:text-accent-600 transition-colors">Blog</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary-900 font-bold truncate">Learn More</span>
          </nav>

          <article className="bg-white rounded-3xl shadow-sm border border-primary-200 overflow-hidden">
            <div className="h-64 sm:h-96 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1200"
                alt="Learn More"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-6 text-sm text-primary-500 mb-6 border-b border-primary-100 pb-6">
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> 20 Learn More 2026</span>
                <span className="flex items-center gap-2"><User className="w-5 h-5" /> Learn More. Learn More</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-8 leading-tight">
                Learn More
              </h1>

              <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-6">
                <p className="leading-relaxed text-xl">
                  Learn More (Active Ingredients) Learn More.
                </p>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">Learn More</h2>
                <p className="leading-relaxed">
                  Learn More. Learn More (Base Ingredients) Learn More "Learn More" Home.
                </p>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">Learn More:</h2>
                <ul className="list-disc list-inside space-y-3 leading-relaxed bg-primary-50 p-6 rounded-2xl border border-primary-100">
                  <li><strong>Learn More (Vitamin C):</strong> Learn More.</li>
                  <li><strong>Learn More (Retinol):</strong> Learn More.</li>
                  <li><strong>Learn More (AHAs):</strong> Learn More.</li>
                  <li><strong>Learn More (Niacinamide):</strong> Learn More.</li>
                </ul>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">Learn More (Concentration)</h2>
                <p className="leading-relaxed">
                  Learn More. Processing... (Learn More 0.1%) Learn More.
                </p>

                <div className="bg-accent-50 border-r-4 border-accent-600 p-6 rounded-l-2xl my-8">
                  <p className="text-accent-900 font-medium italic">
                    "Learn More: Search (INCI List)Learn More."
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
