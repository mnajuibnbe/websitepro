import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageFreeContent } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

function isInternalPath(url: string) {
  return url.startsWith('/');
}

export function FreeContent() {
  const navigate = useNavigate();
  const { data: content } = useHomepageFreeContent();

  return (
    <section className="py-16 md:py-24 bg-primary-50 border-t border-primary-100">
      <PageContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            {content.heading}
          </h2>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            {content.subtext}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 lg:items-center">
          {content.items.map((item) => {
            const Icon = resolveHomepageIcon(item.icon);
            const isProminent = item.isProminent;
            return (
              <div
                key={item.title}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group ${
                  isProminent
                    ? 'border-accent-500 shadow-lg md:scale-105 z-10'
                    : 'border-primary-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="relative aspect-[16/10] bg-primary-200 overflow-hidden">
                  <OptimizedImage src={item.imageUrl} alt={item.title} displayWidth={600} width="600" height="338" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant={isProminent ? 'accent' : 'default'} className={isProminent ? 'bg-accent-600 text-white' : 'bg-white text-primary-700'}>
                      {item.typeLabel}
                    </Badge>
                  </div>
                  {item.typeLabel !== 'Learning Resource' && (
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
                  <Button
                    variant={isProminent ? 'primary' : 'tertiary'}
                    className={isProminent ? 'w-full h-12 text-lg' : 'p-0 h-auto justify-start text-accent-600 hover:text-accent-700 hover:bg-transparent px-0 font-bold'}
                    onClick={() => { if (isInternalPath(item.linkUrl)) navigate(item.linkUrl); }}
                  >
                    {item.ctaLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-12 md:mt-16">
          <Button variant="secondary" className="px-8 text-lg h-12" onClick={() => { if (isInternalPath(content.viewAllUrl)) navigate(content.viewAllUrl); }}>
            {content.viewAllLabel}
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}
