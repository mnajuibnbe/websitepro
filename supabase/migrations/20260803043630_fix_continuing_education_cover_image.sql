update public.blog_posts
set
  cover_image_url = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
  updated_at = now()
where slug = 'sample-article-continuing-education';
