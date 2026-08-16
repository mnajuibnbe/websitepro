import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {
  Bold, Heading2, Heading3, Heading4, Image as ImageIcon, Italic, Link2, List, ListOrdered,
  MousePointerClick, Pilcrow, Quote, Redo2, HelpCircle, Table as TableIcon, Undo2, Video as VideoIcon,
} from 'lucide-react';
import { sanitizeBlogContentHtml } from '../../lib/blogContentHtml';
import { VideoEmbed, type VideoEmbedAttrs } from './tiptap/VideoEmbedExtension';
import { FaqBlock } from './tiptap/FaqExtension';
import { CalloutBlock } from './tiptap/CalloutExtension';
import { CtaButtonBlock, type ButtonBlockAttrs } from './tiptap/ButtonBlockExtension';
import { MediaUrlDialog } from './MediaUrlDialog';
import { LinkPickerDialog, type LinkPickerResult } from './LinkPickerDialog';

interface BlogContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({ onClick, active, label, disabled, children }: { onClick: () => void; active?: boolean; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-accent-100 text-accent-700' : 'text-primary-500 hover:bg-primary-100 hover:text-primary-900'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-5 w-px flex-none bg-primary-200" />;
}

type EditTarget = { kind: 'video'; current: VideoEmbedAttrs; apply: (attrs: VideoEmbedAttrs) => void } | { kind: 'button'; current: ButtonBlockAttrs; apply: (attrs: ButtonBlockAttrs) => void } | null;

export function BlogContentEditor({ value, onChange, placeholder }: BlogContentEditorProps) {
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [insertDialog, setInsertDialog] = useState<'image' | 'video' | 'internal-link' | 'external-link' | 'button' | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: placeholder || 'Write the article…' }),
      ImageExtension.configure({ HTMLAttributes: { loading: 'lazy' } }),
      LinkExtension.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      VideoEmbed.configure({ onEdit: (current, apply) => setEditTarget({ kind: 'video', current, apply }) }),
      FaqBlock,
      CalloutBlock,
      CtaButtonBlock.configure({ onEdit: (current, apply) => setEditTarget({ kind: 'button', current, apply }) }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? '' : sanitizeBlogContentHtml(e.getHTML()));
    },
    editorProps: {
      attributes: {
        class: 'blog-content-editor min-h-[20rem] focus:outline-none text-base leading-relaxed text-primary-900',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current) editor.commands.setContent(value || '', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const applyLink = (result: LinkPickerResult) => {
    const attrs = { href: result.href, target: result.internal ? null : '_blank', rel: result.internal ? null : 'noopener noreferrer' };
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
    } else {
      editor.chain().focus().insertContent({ type: 'text', text: result.label, marks: [{ type: 'link', attrs }] }).run();
    }
    setInsertDialog(null);
  };

  const applyButton = (result: LinkPickerResult) => {
    if (editTarget?.kind === 'button') {
      editTarget.apply({ href: result.href, internal: result.internal, label: result.label });
      setEditTarget(null);
    } else {
      editor.commands.insertCtaButtonBlock({ href: result.href, internal: result.internal, label: result.label });
    }
    setInsertDialog(null);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-primary-200 bg-primary-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent-500">
      <div className="flex flex-wrap items-center gap-1 border-b border-primary-200/70 bg-white px-2 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} label="Paragraph"><Pilcrow className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading 2"><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Heading 3"><Heading3 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} label="Heading 4"><Heading4 className="h-4 w-4" /></ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list"><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote"><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => setInsertDialog('image')} label="Insert image"><ImageIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => setInsertDialog('video')} label="Insert video"><VideoIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Insert table"><TableIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.commands.insertFaqBlock()} label="Insert FAQ block"><HelpCircle className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.commands.insertCalloutBlock()} label="Insert callout"><span className="text-sm font-bold leading-none">!</span></ToolbarButton>
        <ToolbarButton onClick={() => setInsertDialog('button')} label="Insert button"><MousePointerClick className="h-4 w-4" /></ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => setInsertDialog('internal-link')} active={editor.isActive('link')} label="Internal link"><Link2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => setInsertDialog('external-link')} label="External link"><Link2 className="h-4 w-4 opacity-60" /></ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo"><Undo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo"><Redo2 className="h-4 w-4" /></ToolbarButton>
      </div>
      <div className="px-4 py-4">
        <EditorContent editor={editor} />
      </div>

      <MediaUrlDialog
        isOpen={insertDialog === 'image'}
        onClose={() => setInsertDialog(null)}
        kind="image"
        onConfirmImage={({ src, alt }) => { editor.chain().focus().setImage({ src, alt }).run(); setInsertDialog(null); }}
      />
      <MediaUrlDialog
        isOpen={insertDialog === 'video'}
        onClose={() => setInsertDialog(null)}
        kind="video"
        onConfirmVideo={({ provider, url }) => { editor.commands.insertVideoEmbed({ provider, url }); setInsertDialog(null); }}
      />
      <MediaUrlDialog
        isOpen={editTarget?.kind === 'video'}
        onClose={() => setEditTarget(null)}
        kind="video"
        initialSrc={editTarget?.kind === 'video' ? editTarget.current.url || '' : ''}
        onConfirmVideo={({ provider, url }) => { if (editTarget?.kind === 'video') editTarget.apply({ provider, url }); setEditTarget(null); }}
      />
      <LinkPickerDialog
        isOpen={insertDialog === 'internal-link' || insertDialog === 'external-link'}
        onClose={() => setInsertDialog(null)}
        onConfirm={applyLink}
        initialInternal={insertDialog === 'internal-link'}
      />
      <LinkPickerDialog
        isOpen={insertDialog === 'button' || editTarget?.kind === 'button'}
        onClose={() => { setInsertDialog(null); setEditTarget(null); }}
        onConfirm={applyButton}
        showLabelField
        initialHref={editTarget?.kind === 'button' ? editTarget.current.href || '' : ''}
        initialInternal={editTarget?.kind === 'button' ? editTarget.current.internal : true}
        initialLabel={editTarget?.kind === 'button' ? editTarget.current.label : ''}
      />
    </div>
  );
}
