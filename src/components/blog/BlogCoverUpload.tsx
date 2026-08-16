import { ChangeEvent, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { OptimizedImage } from '../ui/OptimizedImage';
import { formatFileSize } from '../../lib/courseCover';
import { processBlogCover } from '../../lib/blogCover';

/**
 * Same upload contract as CourseCoverUpload (src/components/admin/course/CourseCoverUpload.tsx):
 * resize/crop/re-encode to WebP client-side, upload to a dedicated Supabase Storage bucket, store
 * only the resulting public URL in Postgres (blog_posts.cover_image_url already CHECKs it's an
 * https:// URL). No new account/credential needed -- this project already runs on Supabase.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function BlogCoverUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<string | null>(null);

  const removeCover = () => { setOptimization(null); onChange(''); };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    if (!ACCEPTED.has(file.type)) { setError('Choose a JPG, PNG, WebP, or AVIF image.'); return; }
    if (file.size > MAX_BYTES) { setError('The cover image must be 5 MB or smaller.'); return; }
    setUploading(true); setError(null);
    try {
      const processed = await processBlogCover(file);
      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from('blog-covers').upload(path, processed.blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('blog-covers').getPublicUrl(path);
      onChange(data.publicUrl);
      setOptimization(`${processed.width} × ${processed.height} WebP · ${formatFileSize(processed.originalBytes)} → ${formatFileSize(processed.processedBytes)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The cover could not be uploaded. Please try again.');
    } finally { setUploading(false); }
  };

  return <div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={event => void selectFile(event)} />
    {value ? <div className="overflow-hidden rounded-2xl border border-primary-200 bg-primary-50"><div className="aspect-video"><OptimizedImage src={value} alt="Cover image preview" displayWidth={1200} className="h-full w-full object-cover" /></div><div className="flex flex-wrap items-center justify-between gap-3 p-3"><p className="text-xs text-primary-500">Used as the article's featured image and social share preview.</p><div className="flex gap-2"><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-200 bg-white px-3 text-sm font-bold text-primary-700"><UploadCloud className="h-4 w-4" />Replace</button><button type="button" disabled={uploading} onClick={removeCover} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-danger-200 bg-white px-3 text-sm font-bold text-danger-700"><Trash2 className="h-4 w-4" />Remove</button></div></div></div> : <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-6 text-center transition-colors hover:border-accent-500 hover:bg-accent-50/40 focus:outline-none focus:ring-2 focus:ring-accent-500">{uploading ? <Loader2 className="mb-3 h-7 w-7 animate-spin text-accent-600" /> : <ImagePlus className="mb-3 h-7 w-7 text-accent-600" />}<span className="font-bold text-primary-900">{uploading ? 'Optimizing and uploading…' : 'Upload cover image'}</span><span className="mt-1 text-xs text-primary-500">JPG, PNG, WebP, or AVIF · up to 5 MB · at least 800 × 450 · saved as optimized WebP</span></button>}
    {optimization && !error && <p role="status" className="mt-2 text-sm font-bold text-success-700">Optimized: {optimization}</p>}{error && <p role="alert" className="mt-2 text-sm font-bold text-danger-600">{error}</p>}
  </div>;
}
