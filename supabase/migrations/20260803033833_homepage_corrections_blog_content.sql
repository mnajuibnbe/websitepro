alter table public.blog_posts
  add column content text;

update public.blog_posts
set
  title = 'How Evidence-Based Learning Supports Better Practice',
  excerpt = 'A practical look at turning credible education into confident professional decisions.',
  cover_image_url = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1200',
  content = 'Evidence-based learning starts with a clear question and information drawn from credible, relevant sources. It also asks professionals to consider how that information fits the person, setting, and decision in front of them.

Good education makes the reasoning visible. It explains why a recommendation is made, where uncertainty remains, and which details may change the conclusion. This helps learners move beyond memorising isolated facts.

Reflection completes the process. Revisiting outcomes, discussing cases with peers, and updating knowledge as evidence develops can turn a course into an ongoing professional habit.'
where slug = 'sample-article-evidence-based-learning';

update public.blog_posts
set
  title = 'A Practical Framework for Reading Skincare Research',
  excerpt = 'Simple questions that help professionals assess skincare studies with greater clarity.',
  cover_image_url = 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=1200',
  content = 'Begin with the research question. A useful study should clearly describe what was tested, who participated, how outcomes were measured, and how long the observation lasted.

Next, look at the comparison and the size of the effect. A statistically noticeable result is not always meaningful in day-to-day practice, and a promising conclusion should still be considered alongside study limitations.

Finally, compare the study population and conditions with the professional context in which the finding might be used. This step helps separate an interesting result from one that is genuinely applicable.'
where slug = 'sample-article-reading-skincare-research';

update public.blog_posts
set
  title = 'Making Continuing Education Part of Your Routine',
  excerpt = 'A sustainable approach to professional learning that fits around a busy schedule.',
  cover_image_url = 'https://images.unsplash.com/photo-1571781526291-c477eb311dc6?auto=format&fit=crop&q=80&w=1200',
  content = 'Continuing education is easier to sustain when it is connected to a real professional need. Choose one focused topic, define what you want to understand, and set aside a small, repeatable block of time.

Active learning can make that time more valuable. Take concise notes, explain the idea in your own words, and identify one question to investigate further rather than trying to retain everything at once.

Apply and review what you learn. A short reflection after a course or article can reveal what changed, what still feels uncertain, and which subject should come next.'
where slug = 'sample-article-continuing-education';

alter table public.blog_posts
  alter column content set not null;

alter table public.blog_posts
  add constraint blog_posts_content_length
  check (char_length(btrim(content)) between 40 and 20000);
