export interface HomepageStats {
  studentsValue: string;
  coursesValue: string;
  learningHoursValue: string;
}

export interface HomepagePreviewLesson {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
}

export const PRIMARY_DIPLOMA_COURSE_ID = 'e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0';
export const PRIMARY_DIPLOMA_PATH = `/course/${PRIMARY_DIPLOMA_COURSE_ID}`;
/** Fallback only, shown before the real dual-currency price resolves. Never a final display value. */
export const PRIMARY_DIPLOMA_CTA_FALLBACK = 'Enroll in Part 1';

export function formatHomepageCourseCta(courseTitle: string, price: string) {
  const partName = courseTitle.match(/\bPart\s+\d+\b/i)?.[0] || courseTitle;
  return `Enroll in ${partName} — ${price}`;
}

export interface HomepageTestimonial {
  review_id: string;
  reviewer_name: string;
  rating: number | null;
  comment: string;
  created_at: string | null;
  source: 'platform' | 'legacy_import';
  title: string;
}

export function chooseHomepageTestimonials(
  platformReviews: HomepageTestimonial[],
  legacyTestimonials: HomepageTestimonial[],
) {
  return platformReviews.length > 0 ? platformReviews : legacyTestimonials;
}

// ============================================================================
// Editable homepage content sections. Each default below matches the copy
// this section shipped with before it became admin-editable, so first paint
// (and any fetch failure) still renders the real, previously-hardcoded page.
// ============================================================================

export interface HomepageIconItem { title: string; description: string; icon: string; }

export interface HomepageBadgeItem { label: string; icon: string; }

export interface HomepageHeroContent {
  eyebrowText: string;
  headlinePrefix: string;
  headlineHighlight: string;
  subtext: string;
  ctaLabel: string;
  trustBadges: HomepageBadgeItem[];
  videoBadgeText: string;
  videoHeading: string;
  videoDescription: string;
  videoPlayLabel: string;
}
export const DEFAULT_HERO_CONTENT: HomepageHeroContent = {
  eyebrowText: 'Skincare science for professionals',
  headlinePrefix: 'Learn the science behind skincare',
  headlineHighlight: 'and use it in real practice.',
  subtext: 'Online courses in skin, hair and cosmetic ingredients, taught in Arabic and built for pharmacists, pharmacy students and skincare professionals.',
  ctaLabel: 'Browse Courses',
  trustBadges: [
    { label: 'Evidence-based content', icon: 'CheckCircle2' },
    { label: 'Expert-led courses', icon: 'BookOpen' },
    { label: 'Lifetime course access', icon: 'RefreshCw' },
  ],
  videoBadgeText: 'Real course preview',
  videoHeading: 'See what a Tutiba lesson feels like.',
  videoDescription: 'Watch a lesson from the actual course before you enroll.',
  videoPlayLabel: 'Watch Preview',
};

export interface HomepageWhyChooseUsContent {
  eyebrowText: string;
  headingPrefix: string;
  headingHighlight: string;
  subtext: string;
  ctaLabel: string;
  features: HomepageIconItem[];
}
export const DEFAULT_WHY_CHOOSE_US_CONTENT: HomepageWhyChooseUsContent = {
  eyebrowText: 'Why Tutiba',
  headingPrefix: 'A simpler way to',
  headingHighlight: 'learn skincare science.',
  subtext: 'Courses built around real ingredients, real products, and real practice.',
  ctaLabel: 'Browse courses',
  features: [
    { title: 'Taught in Arabic', description: 'The explanation is in Arabic, while ingredient names and professional terms stay in English.', icon: 'BookOpen' },
    { title: 'Practical, not just theoretical', description: 'Lessons connect the science to real ingredients and products.', icon: 'Target' },
    { title: 'Preview before you pay', description: 'Watch selected lessons from the actual course before enrolling.', icon: 'PlayCircle' },
    { title: 'Learn at your own pace', description: 'Study when it suits you, and keep access to your course whenever you want to come back to it.', icon: 'Clock3' },
  ],
};

export interface HomepageLearningMethodContent {
  eyebrowText: string;
  heading: string;
  subtext: string;
  curriculum: HomepageIconItem[];
}
export const DEFAULT_LEARNING_METHOD_CONTENT: HomepageLearningMethodContent = {
  eyebrowText: "Who it's for",
  heading: 'Built for people who want to understand skincare, not just memorize products.',
  subtext: 'Wherever you are in your career, the courses start from the same scientific foundation.',
  curriculum: [
    { title: 'Pharmacists', description: 'Build the scientific knowledge needed to evaluate skincare products, ingredients, and claims with greater confidence.', icon: 'ScanSearch' },
    { title: 'Pharmacy Students & Graduates', description: 'Develop a structured foundation in skincare and cosmeceuticals beyond what you learn from brands and social media.', icon: 'FlaskConical' },
    { title: 'Skincare & Beauty Professionals', description: 'Strengthen your understanding of ingredients, formulations, and evidence behind skincare products.', icon: 'BookOpenCheck' },
  ],
};

export interface HomepageCredentialPill { label: string; icon: string; }
export interface HomepageInstructorContent {
  eyebrowText: string;
  headingPrefix: string;
  headingHighlight: string;
  bio: string;
  instructorName: string;
  photoUrl: string;
  experienceBadgeValue: string;
  experienceBadgeLabel: string;
  credentialPills: HomepageCredentialPill[];
  bullets: string[];
}
export const DEFAULT_INSTRUCTOR_CONTENT: HomepageInstructorContent = {
  eyebrowText: 'Your Instructor',
  headingPrefix: 'Taught by',
  headingHighlight: 'Dr. Aya Elbrashy',
  bio: 'Learn skin, hair, and beauty-nutrition science from an educator who has spent more than a decade turning research into decisions professionals use every day.',
  instructorName: 'Dr. Aya Elbrashy — Skin, Hair and Beauty Nutrition',
  photoUrl: '/images/tutiba-instructor-logo.png',
  experienceBadgeValue: '10+',
  experienceBadgeLabel: 'Years of Experience',
  credentialPills: [
    { label: 'Skin & Beauty Nutrition Specialist', icon: 'GraduationCap' },
    { label: 'Evidence-Based Curriculum', icon: 'Microscope' },
  ],
  bullets: [
    'Skin structure linked directly to cosmeceutical action',
    'Ingredient and product comparisons you can apply',
    'Structured diploma stages with visible progress',
  ],
};

export interface HomepageOutcomesContent {
  eyebrowText: string;
  headingPrefix: string;
  headingHighlight: string;
  outcomes: HomepageIconItem[];
}
export const DEFAULT_OUTCOMES_CONTENT: HomepageOutcomesContent = {
  eyebrowText: "What you'll get better at",
  headingPrefix: 'Practical skills,',
  headingHighlight: 'not just facts.',
  outcomes: [
    { title: 'Understand ingredients', description: 'Know what key ingredients do and why they are used.', icon: 'ScanSearch' },
    { title: 'Read products better', description: 'Look beyond the front label and understand what is actually in the product.', icon: 'FileText' },
    { title: 'Compare options', description: 'Compare products using the ingredients and the science behind them.', icon: 'Layers' },
    { title: 'Connect science to practice', description: 'Use what you learn when looking at real skincare products and cases.', icon: 'Target' },
  ],
};

export interface HomepageFreeContentItem {
  typeLabel: string;
  title: string;
  icon: string;
  imageUrl: string;
  ctaLabel: string;
  linkUrl: string;
  isProminent: boolean;
}
export interface HomepageFreeContentSection {
  heading: string;
  subtext: string;
  items: HomepageFreeContentItem[];
  viewAllLabel: string;
  viewAllUrl: string;
}
export const DEFAULT_FREE_CONTENT: HomepageFreeContentSection = {
  heading: 'Explore Free Learning Resources',
  subtext: 'See our teaching approach in action with practical guides and free lessons.',
  items: [
    { typeLabel: 'Guide', title: 'A Practical Guide to Building a Professional Skin-Care Routine', icon: 'FileText', imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop', ctaLabel: 'Read the Guide', linkUrl: '/courses', isProminent: false },
    { typeLabel: 'Video Lesson', title: 'How to Evaluate Active Ingredients in Skin-Care Products', icon: 'PlayCircle', imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop', ctaLabel: 'Watch the Lesson', linkUrl: '/courses', isProminent: true },
    { typeLabel: 'Learning Resource', title: 'How to Read and Understand an INCI Ingredient List', icon: 'Play', imageUrl: 'https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=600&auto=format&fit=crop', ctaLabel: 'Read the Guide', linkUrl: '/courses', isProminent: false },
  ],
  viewAllLabel: 'View All Free Resources',
  viewAllUrl: '/courses',
};

interface FreeContentItemRow {
  type_label: string;
  title: string;
  icon: string;
  image_url: string;
  cta_label: string;
  link_url: string;
  is_prominent: boolean;
}

/** The `items` JSONB column stores snake_case keys (matching every other DB column in this project); the frontend works in camelCase. */
export function mapFreeContentItemFromRow(row: FreeContentItemRow): HomepageFreeContentItem {
  return { typeLabel: row.type_label, title: row.title, icon: row.icon, imageUrl: row.image_url, ctaLabel: row.cta_label, linkUrl: row.link_url, isProminent: row.is_prominent };
}

export function mapFreeContentItemToRow(item: HomepageFreeContentItem): FreeContentItemRow {
  return { type_label: item.typeLabel, title: item.title, icon: item.icon, image_url: item.imageUrl, cta_label: item.ctaLabel, link_url: item.linkUrl, is_prominent: item.isProminent };
}

export interface HomepageFaqEntry {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
}

// ============================================================================
// Homepage section order/visibility. Hero always renders first and Newsletter keeps
// its own separate FEATURE_FLAGS.newsletter gate -- neither is part of this list.
// ============================================================================

export const HOMEPAGE_SECTION_KEYS = [
  'stats', 'why_choose_us', 'featured_courses', 'instructor', 'learning_method',
  'outcomes', 'testimonials', 'free_content', 'latest_articles', 'faq', 'final_cta',
  'course_previews',
] as const;
export type HomepageSectionKey = typeof HOMEPAGE_SECTION_KEYS[number];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  stats: 'Marketing statistics band',
  why_choose_us: 'Why Tutiba',
  featured_courses: 'Featured courses',
  instructor: 'Instructor',
  learning_method: "Audience (\"Who it's for\")",
  outcomes: 'Learning outcomes',
  testimonials: 'Testimonials',
  free_content: 'Free learning resources (retired from default layout)',
  latest_articles: 'Latest articles',
  faq: 'FAQ preview',
  final_cta: 'Final call to action',
  course_previews: 'Course preview lessons',
};

export interface HomepageSectionLayoutEntry {
  sectionKey: HomepageSectionKey;
  displayOrder: number;
  isVisible: boolean;
}

/** Matches the exact order the homepage shipped with before this became admin-editable. */
export const DEFAULT_SECTION_LAYOUT: HomepageSectionKey[] = [...HOMEPAGE_SECTION_KEYS];
