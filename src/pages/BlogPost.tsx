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
            <span className="text-primary-900 font-bold truncate">Understanding Active Ingredients</span>
          </nav>

          <article className="bg-white rounded-3xl shadow-sm border border-primary-200 overflow-hidden">
            <div className="h-64 sm:h-96 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1200"
                alt="Cosmetic skin-care products arranged for ingredient analysis"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-6 text-sm text-primary-500 mb-6 border-b border-primary-100 pb-6">
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> July 20, 2026</span>
                <span className="flex items-center gap-2"><User className="w-5 h-5" /> Tutiba Education Team</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-8 leading-tight">
                Understanding Active Ingredients in Skin Care
              </h1>

              <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-6">
                <p className="leading-relaxed text-xl">
                  Active ingredients are the components of a formulation selected to deliver a specific skin-care benefit. Understanding their role helps professionals evaluate products more confidently.
                </p>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">What Makes an Ingredient Active?</h2>
                <p className="leading-relaxed">
                  An active ingredient targets a defined concern, while supporting ingredients contribute to texture, stability, preservation, and delivery. A strong formulation depends on both groups working together.
                </p>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">Common Examples</h2>
                <ul className="list-disc list-inside space-y-3 leading-relaxed bg-primary-50 p-6 rounded-2xl border border-primary-100">
                  <li><strong>Vitamin C:</strong> Often used in antioxidant and brightening formulations.</li>
                  <li><strong>Retinol:</strong> Commonly selected to support skin renewal and improve visible texture.</li>
                  <li><strong>Alpha hydroxy acids (AHAs):</strong> Used to exfoliate the skin's surface.</li>
                  <li><strong>Niacinamide:</strong> A versatile ingredient used to support the skin barrier and even-looking tone.</li>
                </ul>

                <h2 className="text-2xl font-bold text-primary-900 mt-10 mb-4">Concentration Is Only Part of the Picture</h2>
                <p className="leading-relaxed">
                  A higher percentage does not automatically make a product more effective. Ingredient form, formulation stability, pH, delivery system, and appropriate use all influence performance and tolerability.
                </p>

                <div className="bg-accent-50 border-r-4 border-accent-600 p-6 rounded-l-2xl my-8">
                  <p className="text-accent-900 font-medium italic">
                    "Professional tip: evaluate the complete INCI list and product directions rather than judging a formula by one highlighted ingredient."
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
