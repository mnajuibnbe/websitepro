import { ChangeEvent, useRef, useState } from 'react';
import { ImagePlus, Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { OptimizedImage } from '../../ui/OptimizedImage';
import { formatFileSize } from '../../../lib/courseCover';
import { processInstructorPhoto } from '../../../lib/instructorPhoto';

/** Same upload contract as BlogCoverUpload: optimize client-side to WebP, upload to a
 * dedicated bucket, store only the resulting public URL. Unlike blog/course covers this
 * doesn't force-crop to a fixed aspect -- the instructor photo renders with object-contain,
 * so the source artwork's own proportions are preserved. */
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function InstructorPhotoUpload({ value, onChange, disabled }: { value: string; onChange: (url: string) => void; disabled?: boolean }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<string | null>(null);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    if (!ACCEPTED.has(file.type)) { setError('Choose a JPG, PNG, WebP, or AVIF image.'); return; }
    if (file.size > MAX_BYTES) { setError('The photo must be 8 MB or smaller.'); return; }
    setUploading(true); setError(null);
    try {
      const processed = await processInstructorPhoto(file);
      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from('instructor-photos').upload(path, processed.blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('instructor-photos').getPublicUrl(path);
      onChange(data.publicUrl);
      setOptimization(`${processed.width} × ${processed.height} WebP · ${formatFileSize(processed.originalBytes)} → ${formatFileSize(processed.processedBytes)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The photo could not be uploaded. Please try again.');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={event => void selectFile(event)} disabled={disabled} />
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-2xl border border-primary-200 bg-primary-50">
          {value ? <OptimizedImage src={value} alt="Instructor photo preview" displayWidth={200} className="h-full w-full object-contain" /> : <ImagePlus className="h-6 w-6 text-primary-300" />}
        </div>
        <div>
          <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {uploading ? 'Optimizing and uploading…' : 'Replace photo'}
          </button>
          <p className="mt-2 text-xs text-primary-500">JPG, PNG, WebP, or AVIF · up to 8 MB · at least 300 × 300 · saved as optimized WebP</p>
        </div>
      </div>
      {optimization && !error && <p role="status" className="mt-2 text-sm font-bold text-success-700">Optimized: {optimization}</p>}
      {error && <p role="alert" className="mt-2 text-sm font-bold text-danger-600">{error}</p>}
    </div>
  );
}
