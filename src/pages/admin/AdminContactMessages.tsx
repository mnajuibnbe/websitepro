import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CircleAlert, Loader2, Mail, MessagesSquare, Send } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { RICH_TEXT_TYPOGRAPHY_CLASS, isRichTextEmpty } from '../../lib/richTextHtml';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  reply_count: number;
}

interface Reply {
  id: string;
  admin_id: string;
  admin_name: string;
  message_html: string;
  created_at: string;
  email_status: 'sent' | 'failed';
  email_error: string | null;
}

const TOPIC_LABELS: Record<string, string> = {
  support: 'Account support',
  billing: 'Billing and payments',
  course: 'Course information',
  other: 'Other inquiry',
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function AdminContactMessages() {
  const [sidebar, setSidebar] = useState(false);
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = (type: ToastMessage['type'], message: string) => setToasts((current) => [...current, { id: crypto.randomUUID(), type, message }]);

  const loadList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_contact_submissions');
    if (error) {
      toast('error', 'Unable to load contact messages.');
      setLoading(false);
      return;
    }
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);

  const loadReplies = useCallback(async (submissionId: string) => {
    setRepliesLoading(true);
    const { data, error } = await supabase.rpc('admin_list_contact_submission_replies', { p_submission_id: submissionId });
    if (error) toast('error', 'Unable to load the reply history.');
    setReplies(Array.isArray(data) ? data : []);
    setRepliesLoading(false);
  }, []);

  const select = async (submission: Submission) => {
    setSelectedId(submission.id);
    setDraft('');
    void loadReplies(submission.id);
    if (!submission.read_at) {
      const now = new Date().toISOString();
      setRows((current) => current.map((row) => (row.id === submission.id ? { ...row, read_at: now } : row)));
      const { error } = await supabase.rpc('admin_mark_contact_submission_read', { p_id: submission.id });
      if (error) console.error('[AdminContactMessages] mark-read failed', error);
    }
  };

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) || null, [rows, selectedId]);
  const unreadCount = useMemo(() => rows.filter((row) => !row.read_at).length, [rows]);

  const sendReply = async () => {
    if (!selected || isRichTextEmpty(draft) || sending) return;
    setSending(true);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`/api/contact/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
        body: JSON.stringify({ message: draft }),
      });
      const payload = await response.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'The reply could not be sent.');
      toast('success', 'Reply sent.');
      setDraft('');
      const now = new Date().toISOString();
      setRows((current) => current.map((row) => (row.id === selected.id ? { ...row, replied_at: now, reply_count: row.reply_count + 1 } : row)));
      void loadReplies(selected.id);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'The reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PortalLayout sidebar={<AdminSidebar isOpen={sidebar} setIsOpen={setSidebar} />}>
        <header className="mb-7">
          <p className="text-sm font-bold text-accent-700">Support inbox</p>
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Contact messages</h1>
          <p className="mt-1 text-primary-600">Messages submitted through the public contact form. {unreadCount > 0 ? `${unreadCount} unread.` : 'All caught up.'}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* List */}
          <section className={`overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm ${selected ? 'hidden lg:block' : ''}`}>
            {loading ? (
              <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /></div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <MessagesSquare className="mx-auto mb-3 h-10 w-10 text-primary-300" />
                <p className="font-bold text-primary-900">No messages yet</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-14rem)] divide-y divide-primary-100 overflow-y-auto">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => void select(row)}
                    aria-current={selectedId === row.id ? 'true' : undefined}
                    className={`block w-full px-4 py-4 text-left transition-colors hover:bg-primary-50 ${selectedId === row.id ? 'bg-accent-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`truncate ${row.read_at ? 'font-semibold text-primary-800' : 'font-bold text-primary-900'}`}>{row.name}</span>
                      {!row.read_at && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent-600" aria-label="Unread" />}
                    </div>
                    <p className="mt-1 truncate text-sm text-primary-500">{row.email}</p>
                    <p className={`mt-2 line-clamp-2 text-sm ${row.read_at ? 'text-primary-500' : 'text-primary-700'}`}>{row.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-600">{TOPIC_LABELS[row.topic] || row.topic}</span>
                      {row.replied_at && <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-bold text-success-700">Replied</span>}
                      <span className="ml-auto text-xs text-primary-400">{dateFormatter.format(new Date(row.created_at))}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Detail */}
          <section className={`rounded-2xl border border-primary-200 bg-white shadow-sm ${selected ? '' : 'hidden lg:block'}`}>
            {!selected ? (
              <div className="flex h-full min-h-[24rem] flex-col items-center justify-center p-12 text-center">
                <Mail className="mx-auto mb-3 h-10 w-10 text-primary-300" />
                <p className="font-bold text-primary-900">Select a message</p>
                <p className="mt-1 text-sm text-primary-500">Choose a submission from the list to read and reply.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="border-b border-primary-100 p-5">
                  <button type="button" onClick={() => setSelectedId(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-accent-700 lg:hidden">
                    <ArrowLeft className="h-4 w-4" />Back to messages
                  </button>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-primary-900">{selected.name}</h2>
                      <p className="text-sm text-primary-500" dir="ltr">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
                    </div>
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-600">{TOPIC_LABELS[selected.topic] || selected.topic}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-primary-800">{selected.message}</p>
                  <p className="mt-2 text-xs text-primary-400">Submitted {dateFormatter.format(new Date(selected.created_at))}</p>
                  {selected.status === 'email_failed' && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-warning-700">
                      <CircleAlert className="h-3.5 w-3.5" />The automatic confirmation email to this visitor failed to send.
                    </p>
                  )}
                </div>

                <div className="min-h-[8rem] flex-1 space-y-4 overflow-y-auto p-5">
                  {repliesLoading ? (
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent-600" />
                  ) : replies.length === 0 ? (
                    <p className="text-sm text-primary-400">No replies sent yet.</p>
                  ) : (
                    replies.map((reply) => (
                      <div key={reply.id} className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-primary-500">
                          <span className="font-bold text-primary-700">{reply.admin_name}</span>
                          <span>{dateFormatter.format(new Date(reply.created_at))}</span>
                        </div>
                        <div className={`mt-2 text-sm text-primary-800 ${RICH_TEXT_TYPOGRAPHY_CLASS}`} dangerouslySetInnerHTML={{ __html: reply.message_html }} />
                        {reply.email_status === 'failed' && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-danger-700">
                            <CircleAlert className="h-3.5 w-3.5" />Not delivered{reply.email_error ? ` — ${reply.email_error}` : ''}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-primary-100 p-5">
                  <label className="mb-2 block text-sm font-bold text-primary-900">Reply to {selected.name}</label>
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                    <RichTextEditor value={draft} onChange={setDraft} placeholder="Write a reply…" minHeightClassName="min-h-[6rem]" />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={sending || isRichTextEmpty(draft)}
                      onClick={() => void sendReply()}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {sending ? 'Sending…' : 'Send reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </PortalLayout>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))} />
    </>
  );
}
