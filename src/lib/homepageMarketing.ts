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
  eyebrowText: 'For Skincare & Cosmeceutical Professionals',
  headlinePrefix: 'Turn ingredient science into',
  headlineHighlight: 'decisions you can defend.',
  subtext: 'Structured courses in skin science and cosmeceutical ingredients, built for professionals who evaluate products and advise clients with confidence.',
  ctaLabel: 'See Courses & Pricing',
  trustBadges: [
    { label: 'Evidence-based content', icon: 'CheckCircle2' },
    { label: 'Expert-led courses', icon: 'BookOpen' },
    { label: 'Lifetime course access', icon: 'RefreshCw' },
  ],
  videoBadgeText: 'Welcome to Tutiba',
  videoHeading: 'This is how Tutiba teaches.',
  videoDescription: 'A short look at how a Tutiba lesson connects the science to a real product decision.',
  videoPlayLabel: 'Play welcome video',
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
  eyebrowText: 'The Tutiba Standard',
  headingPrefix: 'Why professionals',
  headingHighlight: 'choose Tutiba.',
  subtext: 'Courses taught by a specialist, organized into clear stages, with lifetime access.',
  ctaLabel: 'Compare all courses',
  features: [
    { title: 'Evidence-Based', description: 'Built on published research and clear reasoning, explained without sales language.', icon: 'Microscope' },
    { title: 'Expert Instructors', description: 'Study with specialists who connect the science to real practice.', icon: 'UsersRound' },
    { title: 'Free Preview Lessons', description: 'Watch a complete lesson before you enroll, so you know exactly what you are paying for.', icon: 'PlayCircle' },
    { title: 'Lifetime Updates', description: 'Return to your courses as lessons and supporting resources are updated.', icon: 'RefreshCw' },
    { title: 'Learn Anywhere', description: 'Works on desktop, tablet, and mobile, wherever you study.', icon: 'Laptop' },
    { title: 'Practical Focus', description: 'Build the skill to evaluate real products, using the science underneath.', icon: 'BookOpenCheck' },
  ],
};

export interface HomepageLearningMethodContent {
  eyebrowText: string;
  heading: string;
  subtext: string;
  curriculum: HomepageIconItem[];
}
export const DEFAULT_LEARNING_METHOD_CONTENT: HomepageLearningMethodContent = {
  eyebrowText: 'Featured curriculum',
  heading: 'Inside this featured course',
  subtext: 'Part 1 moves from skin anatomy into hyaluronic-acid science, ingredient comparison, and product-level application.',
  curriculum: [
    { title: 'Skin layers and product targets', description: 'Evaluate products intended for the dermis and hypodermis against skin structure.', icon: 'ScanSearch' },
    { title: 'Hyaluronic acid by molecular size', description: 'Understand how molecular size changes penetration, effect, and the claims a formula can reasonably make.', icon: 'FlaskConical' },
    { title: 'From ingredient science to product comparison', description: 'Use the scientific foundation to compare finished products by what they actually contain.', icon: 'BookOpenCheck' },
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
  headingPrefix: 'Meet',
  headingHighlight: 'your instructor.',
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
  eyebrowText: 'Why enroll with confidence',
  headingPrefix: 'Built so you can',
  headingHighlight: 'learn it, then use it.',
  outcomes: [
    { title: 'Clear course stages', description: 'Move through ordered stages, like Part 1 and Part 2, so you always know what comes next.', icon: 'Layers' },
    { title: 'Evidence-based curriculum', description: 'Every lesson is grounded in current science and reasoned argument.', icon: 'Microscope' },
    { title: 'Apply it immediately', description: 'Apply the science to real product evaluations and decisions you can stand behind.', icon: 'ScanSearch' },
    { title: 'Secure enrollment', description: 'Checkout and account access are secured end-to-end.', icon: 'ShieldCheck' },
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
] as const;
export type HomepageSectionKey = typeof HOMEPAGE_SECTION_KEYS[number];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  stats: 'Marketing statistics band',
  why_choose_us: 'Why Choose Us',
  featured_courses: 'Featured courses',
  instructor: 'Instructor',
  learning_method: 'Featured curriculum',
  outcomes: 'Outcomes ("Why enroll with confidence")',
  testimonials: 'Testimonials',
  free_content: 'Free learning resources',
  latest_articles: 'Latest articles',
  faq: 'FAQ preview',
  final_cta: 'Final call to action',
};

export interface HomepageSectionLayoutEntry {
  sectionKey: HomepageSectionKey;
  displayOrder: number;
  isVisible: boolean;
}

/** Matches the exact order the homepage shipped with before this became admin-editable. */
export const DEFAULT_SECTION_LAYOUT: HomepageSectionKey[] = [...HOMEPAGE_SECTION_KEYS];
