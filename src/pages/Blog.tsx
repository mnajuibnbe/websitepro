import React, { useEffect } from 'react';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function Blog({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const posts = [
    {
      id: '1',
      title: 'دليلك الشامل لفهم المكونات النشطة في مستحضرات التجميل',
      excerpt: 'تعرف على كيفية قراءة ملصقات المنتجات التجميلية وفهم المكونات النشطة وتأثيراتها الفعلية على البشرة من منظور علمي.',
      date: '20 يوليو 2026',
      author: 'د. آية البراشي',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      title: 'الفروق الجوهرية بين الترطيب والتغذية في العناية بالبشرة',
      excerpt: 'مقال علمي يوضح الفرق بين المواد المرطبة (Humectants) والمواد المطرية (Emollients) ومتى نستخدم كل منها.',
      date: '15 يوليو 2026',
      author: 'فريق توتيبا',
      image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '3',
      title: 'مستقبل الكوسميسوتيكال: اتجاهات عام 2026',
      excerpt: 'نظرة تحليلية لأحدث الابتكارات في عالم المستحضرات الجلدية التجميلية والتقنيات الصاعدة في توصيل المواد الفعالة.',
      date: '10 يوليو 2026',
      author: 'د. أحمد محمد',
      image: 'https://images.unsplash.com/photo-1571781526291-c477eb311dc6?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <MarketingNavbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">المدونة العلمية</h1>
            <p className="text-xl text-primary-600">أحدث المقالات والأبحاث في مجال الكوسميسوتيكال</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article key={post.id} className="bg-white rounded-2xl border border-primary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-primary-500 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author}</span>
                  </div>
                  <h2 className="text-xl font-bold text-primary-900 mb-3 leading-tight group-hover:text-accent-600 transition-colors">
                    <a href="#/blog-post" onClick={(e) => { e.preventDefault(); onNavigate('#/blog-post'); }}>
                      {post.title}
                    </a>
                  </h2>
                  <p className="text-primary-600 text-sm leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <a 
                    href="#/blog-post"
                    onClick={(e) => { e.preventDefault(); onNavigate('#/blog-post'); }}
                    className="inline-flex items-center gap-2 text-accent-600 font-bold hover:text-accent-700 transition-colors"
                  >
                    اقرأ المزيد <ArrowRight className="w-4 h-4" />
                  </a>
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
