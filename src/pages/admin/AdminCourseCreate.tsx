import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  ArrowRight,
  Save,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Globe,
  Tag,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';

// Helper to sanitize slug
export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0621-\u064A\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminCourseCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Skin Care');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels');
  const [language, setLanguage] = useState('Arabic');
  const [price, setPrice] = useState('0');
  const [thumbnail, setThumbnail] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [instructorId, setInstructorId] = useState('');

  // Instructors list for dropdown
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);

  // Validation & Toasts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fetch available instructors / profiles
    async function loadInstructors() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role');

        if (!error && data) {
          const list = data.map((p) => ({
            id: p.id,
            name: p.full_name || 'Instructor',
          }));
          setInstructors(list);
        }
      } catch (err) {
        console.error('Error fetching instructors:', err);
      }
    }
    loadInstructors();
  }, []);

  // Helper to generate slug from title
  const generateSlug = () => {
    if (!title.trim()) return;
    const cleanSlug = sanitizeSlug(title);
    setSlug(cleanSlug);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double click

    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Course';
    }

    const cleanSlug = slug.trim() ? sanitizeSlug(slug) : '';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Please review the information and try again.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Check duplicate slug if slug provided
      if (cleanSlug) {
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (existingCourse) {
          setErrors({ slug: 'Course URL Slug Please review the information and try again.' });
          addToast('error', 'Please review the information and try again.');
          setIsSubmitting(false);
          return;
        }
      }

      const finalInstructorId = instructorId || user?.id || null;
      const parsedPrice = parseFloat(price) || 0;

      // Call RPC admin_create_course strictly - NO FALLBACK to direct insert
      const { data: rpcCourseId, error: rpcError } = await supabase.rpc(
        'admin_create_course',
        {
          p_title: title.trim(),
          p_slug: cleanSlug || null,
          p_short_description: shortDescription.trim() || null,
          p_description: description.trim() || null,
          p_category: category.trim() || null,
          p_level: level,
          p_language: language.trim() || 'Arabic',
          p_price: parsedPrice,
          p_instructor_id: finalInstructorId,
          p_thumbnail: thumbnail.trim() || null,
          p_cover_image: coverImage.trim() || null,
          p_create_first_section: true,
        }
      );

      if (rpcError) {
        console.error('RPC admin_create_course error:', rpcError);
        let errorMsg = 'Unable to complete this action. Please try again. (RPC).';
        if (rpcError.message?.includes('duplicate key') || rpcError.message?.includes('courses_slug_key')) {
          errorMsg = 'Course URL Slug Link.';
          setErrors({ slug: errorMsg });
        }
        addToast('error', errorMsg);
        setIsSubmitting(false);
        return;
      }

      if (!rpcCourseId) {
        addToast('error', 'The requested information could not be loaded. Please try again.');
        setIsSubmitting(false);
        return;
      }

      addToast('success', 'Course!');
      setTimeout(() => {
        navigate(`/admin/courses/${rpcCourseId}/builder`);
      }, 800);
    } catch (err: any) {
      console.error('Error creating course:', err);
      addToast('error', err.message || 'The requested information could not be loaded. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/courses')}
                className="p-2 bg-white rounded-xl border border-primary-200 text-primary-600 hover:text-primary-900 transition-colors"
                title="Courses"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Create</h1>
                <p className="text-primary-600 text-xs sm:text-sm">
                  The requested information could not be loaded. Please try again.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              form="create-course-form"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Create...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>

          <form id="create-course-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Info */}
            <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <span>Basic Information</span>
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Course Title <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder="Example: Professional Skin Care Diploma"
                    className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium ${
                      errors.title ? 'border-danger-400 bg-danger-50/50' : 'border-primary-200'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-danger-600 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-primary-900">
                      Course URL Slug
                    </label>
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate from Title</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="skin-care-diploma"
                    dir="ltr"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm font-mono"
                  />
                  <p className="text-[11px] text-primary-500 mt-1">
                    Public URL: /course/{slug || 'course-id'}
                  </p>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Summarize the course for catalog cards"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the course, its learning outcomes, and its intended audience..."
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm leading-relaxed resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Classification & Pricing */}
            <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-600" />
                <span>Classification, Pricing, and Language</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Skin care, hair care, or professional practice"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                  >
                    <option value="all_levels">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">Course Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Arabic"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Price (SAR; enter 0 for free)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="299"
                      dir="ltr"
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary-500 font-bold">
                      SAR
                    </span>
                  </div>
                </div>

                {/* Instructor */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Assigned Instructor
                  </label>
                  <select
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                  >
                    <option value="">-- Select an instructor (or use default) --</option>
                    {instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Media */}
            <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <span>Images and Media</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Image (Thumbnail URL)
                  </label>
                  <input
                    type="url"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    dir="ltr"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm"
                  />
                  {thumbnail && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-primary-200 h-32 bg-black/5">
                      <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Link (Cover Image URL)
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    dir="ltr"
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm"
                  />
                  {coverImage && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-primary-200 h-32 bg-black/5">
                      <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Form Action */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/courses')}
                className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-xs text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Save...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Course Builder</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
