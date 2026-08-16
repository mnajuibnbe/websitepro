import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';

export type CalloutVariant = 'info' | 'warning' | 'tip';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBlock: {
      insertCalloutBlock: () => ReturnType;
    };
  }
}

const VARIANTS: Record<CalloutVariant, { label: string; icon: typeof Info; classes: string }> = {
  info: { label: 'Note', icon: Info, classes: 'border-info-200 bg-info-50 text-info-800' },
  warning: { label: 'Important', icon: AlertTriangle, classes: 'border-warning-200 bg-warning-50 text-warning-800' },
  tip: { label: 'Tip', icon: Lightbulb, classes: 'border-success-200 bg-success-50 text-success-800' },
};

function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const variant: CalloutVariant = (node.attrs.variant as CalloutVariant) || 'info';
  const { icon: Icon, classes } = VARIANTS[variant];

  return (
    <NodeViewWrapper className={`callout my-2 rounded-xl border p-4 ${classes}`}>
      <div className="mb-2 flex items-center justify-between gap-2" contentEditable={false}>
        <span className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4" />{VARIANTS[variant].label}</span>
        <select
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value })}
          className="rounded-lg border border-current/30 bg-white/60 px-2 py-1 text-xs font-bold outline-none"
          aria-label="Callout type"
        >
          <option value="info">Note</option>
          <option value="warning">Important</option>
          <option value="tip">Tip</option>
        </select>
      </div>
      <NodeViewContent className="callout-body text-sm leading-relaxed [&_p]:mb-0" />
    </NodeViewWrapper>
  );
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-variant') || 'info',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block="callout"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant: CalloutVariant = (node.attrs.variant as CalloutVariant) || 'info';
    return ['div', mergeAttributes(HTMLAttributes, { class: `callout callout-${variant}`, 'data-block': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      insertCalloutBlock: () => ({ chain }) => chain().insertContent({ type: this.name, attrs: { variant: 'info' }, content: [{ type: 'paragraph' }] }).run(),
    };
  },
});
