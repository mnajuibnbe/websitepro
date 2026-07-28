import React, { useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export function Blog() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const posts = [
    {
      id: '1',
      title: 'Building an Evidence-Based Skincare Routine',
      excerpt: 'A practical framework for evaluating skin needs, active ingredients, and product compatibility.',
      date: 'July 20, 2026',
      author: 'Tutiba Education Team',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      title: 'Humectants and Emollients: What Professionals Should Know',
      excerpt: 'Understand how these ingredient groups support hydration and barrier care—and where their roles differ.',
      date: 'July 15, 2026',
      author: 'Tutiba Education Team',
      image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '3',
      title: 'Five Trends Shaping Cosmeceutical Practice in 2026',
      excerpt: 'A concise review of the research, technology, and client-care trends professionals are watching.',
      date: 'July 10, 2026',
      author: 'Tutiba Education Team',
      image: 'https://images.unsplash.com/photo-1571781526291-c477eb311dc6?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">Blog</h1>
            <p className="text-xl text-primary-600">Insights, research, and practical guidance for cosmeceutical professionals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article key={post.id} className="bg-white rounded-2xl border border-primary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="h-48 overflow-hidden">
                  <OptimizedImage
                    src={post.image}
                    alt={post.title}
                    width="800"
                    height="450"
                    displayWidth={800}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-primary-500 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author}</span>
                  </div>
                  <h2 className="text-xl font-bold text-primary-900 mb-3 leading-tight group-hover:text-accent-600 transition-colors">
                    <Link to="/blog-post" onClick={(e) => { e.preventDefault(); navigate('/blog-post'); }}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-primary-600 text-sm leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <Link to="/blog-post"
                    onClick={(e) => { e.preventDefault(); navigate('/blog-post'); }}
                    className="inline-flex items-center gap-2 text-accent-600 font-bold hover:text-accent-700 transition-colors"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
