import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { MousePointerClick, Pencil, Trash2 } from 'lucide-react';

export interface ButtonBlockAttrs { href: string | null; label: string; internal: boolean }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ctaButtonBlock: {
      insertCtaButtonBlock: (attrs: ButtonBlockAttrs) => ReturnType;
    };
  }
}

function ButtonBlockView({ node, updateAttributes, deleteNode, extension }: NodeViewProps) {
  const attrs = node.attrs as ButtonBlockAttrs;
  const openEditDialog = (extension.options as { onEdit?: (current: ButtonBlockAttrs, apply: (attrs: ButtonBlockAttrs) => void) => void }).onEdit;

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-accent-600 shadow-sm"><MousePointerClick className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-primary-900">{attrs.label || 'Button'}</p>
          <p className="truncate text-xs text-primary-500">{attrs.href || 'Click Edit to set a destination'} {attrs.href ? (attrs.internal ? '· Internal' : '· External') : ''}</p>
        </div>
        <button type="button" onClick={() => openEditDialog?.(attrs, updateAttributes)} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-primary-500 hover:bg-white hover:text-accent-700" aria-label="Edit button">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={deleteNode} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-primary-500 hover:bg-white hover:text-danger-600" aria-label="Remove button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const CtaButtonBlock = Node.create<{ onEdit?: (current: ButtonBlockAttrs, apply: (attrs: ButtonBlockAttrs) => void) => void }>({
  name: 'ctaButtonBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { onEdit: undefined };
  },

  addAttributes() {
    return {
      href: { default: null, parseHTML: (el) => el.querySelector('a')?.getAttribute('href') || null, renderHTML: () => ({}) },
      label: { default: 'Learn more', parseHTML: (el) => el.querySelector('a')?.textContent?.trim() || 'Learn more', renderHTML: () => ({}) },
      internal: { default: true, parseHTML: (el) => el.querySelector('a')?.getAttribute('target') !== '_blank', renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block="button"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { href, label, internal } = node.attrs as ButtonBlockAttrs;
    return ['div', mergeAttributes(HTMLAttributes, { class: 'cta-button-wrap', 'data-block': 'button' }),
      ['a', { class: 'cta-button', href: href || '#', ...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' }) }, label || 'Learn more'],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },

  addCommands() {
    return {
      insertCtaButtonBlock: (attrs: ButtonBlockAttrs) => ({ chain }) => chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
