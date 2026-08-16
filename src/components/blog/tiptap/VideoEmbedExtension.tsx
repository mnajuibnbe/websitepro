import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Pencil, Trash2, Video as VideoIcon, Youtube } from 'lucide-react';
import type { BlogVideoUrlProvider } from '../../../domain/videoUrl';

export interface VideoEmbedAttrs { provider: BlogVideoUrlProvider | null; url: string | null }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      insertVideoEmbed: (attrs: VideoEmbedAttrs) => ReturnType;
    };
  }
}

function VideoEmbedView({ node, updateAttributes, deleteNode, extension }: NodeViewProps) {
  const { provider, url } = node.attrs as VideoEmbedAttrs;
  const openEditDialog = (extension.options as { onEdit?: (current: VideoEmbedAttrs, apply: (attrs: VideoEmbedAttrs) => void) => void }).onEdit;

  return (
    <NodeViewWrapper className="my-2">
      <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-accent-600 shadow-sm">
          {provider === 'youtube' ? <Youtube className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary-900">{provider === 'youtube' ? 'YouTube video' : provider === 'google_drive' ? 'Google Drive video' : 'Video (no URL set)'}</p>
          <p className="truncate text-xs text-primary-500">{url || 'Click Edit to add a video URL'}</p>
        </div>
        <button type="button" onClick={() => openEditDialog?.({ provider, url }, updateAttributes)} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-primary-500 hover:bg-white hover:text-accent-700" aria-label="Edit video">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={deleteNode} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-primary-500 hover:bg-white hover:text-danger-600" aria-label="Remove video">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const VideoEmbed = Node.create<{ onEdit?: (current: VideoEmbedAttrs, apply: (attrs: VideoEmbedAttrs) => void) => void }>({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { onEdit: undefined };
  },

  addAttributes() {
    return {
      provider: { default: null, parseHTML: (el) => el.getAttribute('data-provider'), renderHTML: (attrs) => ({ 'data-provider': attrs.provider }) },
      url: { default: null, parseHTML: (el) => el.getAttribute('data-url'), renderHTML: (attrs) => ({ 'data-url': attrs.url }) },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-block': 'video' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },

  addCommands() {
    return {
      insertVideoEmbed: (attrs: VideoEmbedAttrs) => ({ chain }) => chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
