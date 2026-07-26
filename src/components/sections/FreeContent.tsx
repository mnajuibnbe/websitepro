import React from 'react';
import { Button } from '../ui/Button';
import { PlayCircle, FileText, Play } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function FreeContent() {
  const contents = [
    {
      id: 1,
      type: 'Learning Resource',
      title: 'Learning Resource',
      icon: FileText,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
      cta: 'Learning Resource',
      isProminent: false
    },
    {
      id: 2,
      type: 'Lesson',
      title: 'Learning Resource',
      icon: PlayCircle,
      image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop',
      cta: 'Lesson',
      isProminent: true
    },
    {
      id: 3,
      type: 'Learning Resource',
      title: 'Learning Resource (INCI)Learning Resource',
      icon: Play,
      image: 'https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=600&auto=format&fit=crop',
      cta: 'Learning Resource',
      isProminent: false
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-primary-50 border-t border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Start
          </h2>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            Content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 lg:items-center">
          {contents.map((item) => {
            const Icon = item.icon;
            const isProminent = item.isProminent;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group ${
                  isProminent
                    ? 'border-accent-500 shadow-lg md:scale-105 z-10'
                    : 'border-primary-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="relative aspect-[16/10] bg-primary-200 overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant={isProminent ? 'accent' : 'default'} className={isProminent ? 'bg-accent-600 text-white' : 'bg-white text-primary-700'}>
                      {item.type}
                    </Badge>
                  </div>
                  {item.type !== 'Learning Resource' && (
                    <div className="absolute inset-0 bg-primary-900/20 flex items-center justify-center z-10">
                      <div className={`rounded-full bg-white/95 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform duration-300 ${isProminent ? 'w-16 h-16 text-accent-600' : 'w-12 h-12 text-primary-900'}`}>
                        <Icon className={`${isProminent ? 'w-8 h-8' : 'w-6 h-6'} ms-1`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-6 md:p-8 flex flex-col flex-grow ${isProminent ? 'bg-accent-50/30' : ''}`}>
                  <h3 className={`font-bold text-primary-900 mb-6 flex-grow leading-snug ${isProminent ? 'text-2xl' : 'text-xl'}`}>
                    {item.title}
                  </h3>
                  <Button variant={isProminent ? 'primary' : 'tertiary'} className={isProminent ? 'w-full h-12 text-lg' : 'p-0 h-auto justify-start text-accent-600 hover:text-accent-700 hover:bg-transparent px-0 font-bold'}>
                    {item.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-12 md:mt-16">
          <Button variant="secondary" className="px-8 text-lg h-12">
            Free
          </Button>
        </div>
      </div>
    </section>
  );
}
