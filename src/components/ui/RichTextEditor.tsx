import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { sanitizeRichText, RICH_TEXT_TYPOGRAPHY_CLASS } from '../../lib/richTextHtml';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: boolean;
  ariaDescribedBy?: string;
  minHeightClassName?: string;
}

function ToolbarButton({ onClick, active, label, children }: { onClick: () => void; active: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-accent-100 text-accent-700' : 'text-primary-500 hover:bg-primary-100 hover:text-primary-900'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, error, ariaDescribedBy, minHeightClassName = 'min-h-[7.5rem]' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? '' : sanitizeRichText(e.getHTML()));
    },
    editorProps: {
      attributes: {
        class: `rich-text-editor focus:outline-none text-sm font-medium leading-relaxed text-primary-900 ${minHeightClassName} ${RICH_TEXT_TYPOGRAPHY_CLASS}`,
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`w-full overflow-hidden rounded-xl border bg-primary-50 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-accent-500 ${error ? 'border-danger-400' : 'border-primary-200'}`}>
      <div className="flex items-center gap-1 border-b border-primary-200/70 bg-white px-2 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-primary-200" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
