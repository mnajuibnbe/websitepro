import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Edit3, FileText, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { BlogContentEditor } from '../../components/blog/BlogContentEditor';
import { SeoSidebar } from '../../components/blog/SeoSidebar';
import { supabase } from '../../lib/supabase';
import { isBlogContentEmpty } from '../../lib/blogContentHtml';
import { deriveCanonicalUrl, deriveMetaDescription, deriveSeoTitle, metaDescriptionHint, seoTitleHint } from '../../lib/blogSeo';
import type { BlogPost, BlogPostInput, BlogPostStatus } from '../../services/blogPosts.service';

const EMPTY: BlogPostInput = { slug: '', title: '', excerpt: '', content: '', cover_image_url: null, status: 'draft', published_at: null, seo_title: null, meta_description: null, primary_keyword: null, secondary_keywords: [], search_intent: null, original_value_signals: [], sources: [] };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function AdminBlogPosts() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlogPostInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => { setLoading(true); const { data, error } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false }); if (!error) setPosts((data || []) as BlogPost[]); else setMessage('Blog posts could not be loaded.'); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const reset = () => { setEditingId(null); setForm(EMPTY); setMessage(''); };
  const edit = (post: BlogPost) => { setEditingId(post.id); setForm({ slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content, cover_image_url: post.cover_image_url, status: post.status, published_at: post.published_at, seo_title: post.seo_title, meta_description: post.meta_description, primary_keyword: post.primary_keyword, secondary_keywords: post.secondary_keywords || [], search_intent: post.search_intent, original_value_signals: post.original_value_signals || [], sources: post.sources || [] }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setStatus = (status: BlogPostStatus) => setForm(current => ({ ...current, status, published_at: status === 'published' ? current.published_at || new Date().toISOString() : null }));

  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    const payload: BlogPostInput = {
      ...form,
      slug: slugify(form.slug || form.title),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      cover_image_url: form.cover_image_url?.trim() || null,
      seo_title: form.seo_title?.trim() || null,
      meta_description: form.meta_description?.trim() || null,
      primary_keyword: form.primary_keyword?.trim() || null,
      secondary_keywords: form.secondary_keywords.map((q) => q.trim()).filter(Boolean),
      published_at: form.status === 'published' ? form.published_at || new Date().toISOString() : null,
    };
    if (!payload.slug || payload.title.length < 3 || payload.excerpt.length < 10 || isBlogContentEmpty(payload.content)) { setMessage('Add a title, valid slug, excerpt, and article content before saving.'); return; }
    setSaving(true); const result = editingId ? await supabase.from('blog_posts').update(payload).eq('id', editingId) : await supabase.from('blog_posts').insert(payload); setSaving(false);
    if (result.error) setMessage(result.error.message); else { reset(); await load(); }
  };
  const remove = async (id: number) => { if (!window.confirm('Delete this blog post?')) return; const { error } = await supabase.from('blog_posts').delete().eq('id', id); if (error) setMessage(error.message); else await load(); };

  const effectiveSeoTitle = form.seo_title?.trim() || deriveSeoTitle(form.title);
  const effectiveMetaDescription = form.meta_description?.trim() || deriveMetaDescription(form.excerpt, form.content);
  const canonicalUrl = form.slug ? deriveCanonicalUrl(window.location.origin, slugify(form.slug)) : null;

  return <div className="min-h-screen bg-primary-50" dir="ltr"><AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} /><main id="main-content" className="pb-24 pt-20 lg:pl-72 lg:pt-8"><PageContainer><div className="mx-auto max-w-7xl"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Content</p><h1 className="mt-2 text-3xl font-bold text-primary-900">Blog posts</h1><p className="mt-2 text-primary-600">Create, edit, and publish full articles and their homepage previews.</p></div><div className="grid gap-8 xl:grid-cols-[1fr_340px]">
    <form onSubmit={save} className="h-fit rounded-2xl border border-primary-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-primary-900">{editingId ? 'Edit post' : 'New post'}</h2>{editingId && <button type="button" onClick={reset} aria-label="Cancel editing" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-primary-50"><X className="h-5 w-5" /></button>}</div>
      <div className="mt-6 space-y-4">
        <Field label="Title"><input value={form.title} onChange={e => setForm(current => ({ ...current, title: e.target.value, slug: current.slug || slugify(e.target.value), primary_keyword: current.primary_keyword || e.target.value }))} required maxLength={180} className="field" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={e => setForm(current => ({ ...current, slug: slugify(e.target.value) }))} required className="field" /></Field>
        <Field label="Excerpt"><textarea value={form.excerpt} onChange={e => setForm(current => ({ ...current, excerpt: e.target.value }))} required minLength={10} maxLength={600} rows={3} className="field" /></Field>
        <label className="block text-sm font-bold text-primary-800">Article content
          <div className="mt-2"><BlogContentEditor value={form.content} onChange={html => setForm(current => ({ ...current, content: html }))} /></div>
        </label>
        <Field label="Cover image URL (optional)"><input type="url" value={form.cover_image_url || ''} onChange={e => setForm(current => ({ ...current, cover_image_url: e.target.value }))} className="field" /></Field>
        <Field label="Status"><select value={form.status} onChange={e => setStatus(e.target.value as BlogPostStatus)} className="field"><option value="draft">Draft</option><option value="published">Published</option></select></Field>

        <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
          <h3 className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Search &amp; sharing</h3>
          <p className="mt-1 text-xs text-primary-500">These override the defaults derived from the title and excerpt. Google may still rewrite either in search results — there is no fixed character limit to hit.</p>
          <div className="mt-4 space-y-4">
            <Field label="SEO title (optional override)">
              <input value={form.seo_title || ''} onChange={e => setForm(current => ({ ...current, seo_title: e.target.value }))} placeholder={deriveSeoTitle(form.title)} className="field" />
            </Field>
            {seoTitleHint(effectiveSeoTitle) && <p className="text-xs text-primary-500">{seoTitleHint(effectiveSeoTitle)}</p>}
            <Field label="Meta description (optional override)">
              <textarea value={form.meta_description || ''} onChange={e => setForm(current => ({ ...current, meta_description: e.target.value }))} placeholder={deriveMetaDescription(form.excerpt, form.content)} rows={3} className="field" />
            </Field>
            {metaDescriptionHint(effectiveMetaDescription) && <p className="text-xs text-primary-500">{metaDescriptionHint(effectiveMetaDescription)}</p>}
            <div>
              <span className="block text-sm font-bold text-primary-800">Canonical URL</span>
              <p className="mt-1.5 truncate rounded-xl border border-primary-200 bg-primary-100 px-3 py-2 text-sm text-primary-600">{canonicalUrl || 'Set a slug to see the canonical URL'}</p>
            </div>
          </div>
        </div>
      </div>
      {message && <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">{message}</p>}
      <Button type="submit" className="mt-6 w-full" isLoading={saving} icon={<Save className="h-4 w-4" />}>Save post</Button>
    </form>
    <SeoSidebar
      postId={editingId}
      title={form.title}
      effectiveSeoTitle={effectiveSeoTitle}
      effectiveMetaDescription={effectiveMetaDescription}
      contentHtml={form.content}
      onContentChange={html => setForm(current => ({ ...current, content: html }))}
      coverImageUrl={form.cover_image_url}
      primaryQuery={form.primary_keyword || ''}
      onPrimaryQueryChange={value => setForm(current => ({ ...current, primary_keyword: value }))}
      secondaryQueries={form.secondary_keywords}
      onSecondaryQueriesChange={value => setForm(current => ({ ...current, secondary_keywords: value }))}
      searchIntent={form.search_intent}
      onSearchIntentChange={value => setForm(current => ({ ...current, search_intent: value }))}
      originalValueSignals={form.original_value_signals}
      onOriginalValueSignalsChange={value => setForm(current => ({ ...current, original_value_signals: value }))}
      sources={form.sources}
      onSourcesChange={value => setForm(current => ({ ...current, sources: value }))}
    />
  </div>
  <section className="mt-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-primary-900">All posts</h2><span className="flex items-center gap-2 text-sm text-primary-500"><FileText className="h-4 w-4" />{posts.length}</span></div>{loading ? <Loader2 className="mx-auto my-12 h-7 w-7 animate-spin text-accent-600" /> : <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{posts.map(post => <article key={post.id} className="rounded-xl border border-primary-100 p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-bold text-primary-900">{post.title}</h3><p className="mt-1 line-clamp-2 text-sm text-primary-600">{post.excerpt}</p><span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${post.status === 'published' ? 'bg-success-50 text-success-700' : 'bg-primary-100 text-primary-600'}`}>{post.status}</span></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => edit(post)} aria-label={`Edit ${post.title}`} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-primary-50"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void remove(post.id)} aria-label={`Delete ${post.title}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-50"><Trash2 className="h-4 w-4" /></button></div></div></article>)}{posts.length === 0 && <p className="col-span-full py-10 text-center text-primary-500"><Plus className="mx-auto mb-2 h-6 w-6" />Create the first post.</p>}</div>}</section>
  </div></PageContainer></main></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-primary-800">{label}<span className="mt-2 block [&_.field]:min-h-11 [&_.field]:w-full [&_.field]:rounded-xl [&_.field]:border [&_.field]:border-primary-200 [&_.field]:bg-primary-50 [&_.field]:px-3 [&_.field]:py-2 [&_.field]:font-normal [&_.field]:outline-none [&_.field]:focus:border-accent-500 [&_.field]:focus:ring-2 [&_.field]:focus:ring-accent-500">{children}</span></label>;
}
