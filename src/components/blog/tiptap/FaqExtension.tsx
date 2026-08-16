import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';

export interface FaqItem { question: string; answer: string }
export interface FaqAttrs { items: FaqItem[] }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    faqBlock: {
      insertFaqBlock: () => ReturnType;
    };
  }
}

const EMPTY_ITEM: FaqItem = { question: '', answer: '' };

function FaqView({ node, updateAttributes }: NodeViewProps) {
  const items: FaqItem[] = (node.attrs as FaqAttrs).items?.length ? (node.attrs as FaqAttrs).items : [EMPTY_ITEM];

  const setItem = (index: number, patch: Partial<FaqItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateAttributes({ items: next });
  };
  const addItem = () => updateAttributes({ items: [...items, { ...EMPTY_ITEM }] });
  const removeItem = (index: number) => updateAttributes({ items: items.length > 1 ? items.filter((_, i) => i !== index) : items });

  return (
    <NodeViewWrapper className="my-2" data-drag-handle contentEditable={false}>
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary-800"><HelpCircle className="h-4 w-4 text-accent-600" />FAQ block</div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-primary-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <input
                  value={item.question}
                  onChange={(e) => setItem(index, { question: e.target.value })}
                  placeholder="Question readers might ask"
                  className="min-h-11 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm font-bold text-primary-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} aria-label="Remove question" className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-primary-400 hover:bg-danger-50 hover:text-danger-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <textarea
                value={item.answer}
                onChange={(e) => setItem(index, { answer: e.target.value })}
                placeholder="Answer"
                rows={2}
                className="mt-2 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
              />
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-accent-300 px-3 text-sm font-bold text-accent-700 hover:bg-accent-50">
          <Plus className="h-4 w-4" />Add question
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const FaqBlock = Node.create({
  name: 'faqBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      items: {
        default: [{ ...EMPTY_ITEM }],
        parseHTML: (el) => Array.from(el.querySelectorAll(':scope > .faq-item')).map((item) => ({
          question: item.querySelector('.faq-question')?.textContent?.trim() || '',
          answer: item.querySelector('.faq-answer')?.textContent?.trim() || '',
        })),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block="faq"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const items: FaqItem[] = (node.attrs as FaqAttrs).items || [];
    return ['div', mergeAttributes(HTMLAttributes, { class: 'faq-block', 'data-block': 'faq' }),
      ...items.filter((item) => item.question.trim() || item.answer.trim()).map((item) => (
        ['div', { class: 'faq-item' },
          ['h4', { class: 'faq-question' }, item.question],
          ['div', { class: 'faq-answer' }, ['p', {}, item.answer]],
        ]
      )),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqView);
  },

  addCommands() {
    return {
      insertFaqBlock: () => ({ chain }) => chain().insertContent({ type: this.name, attrs: { items: [{ ...EMPTY_ITEM }] } }).run(),
    };
  },
});
