import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Loader2, Plus, Sparkles } from 'lucide-react';
import { blogContentPlainText } from '../../lib/blogContentHtml';
import { buildFaqBlockHtml } from '../../lib/blogQuestionInsert';
import { BlogInsightsUnavailableError, fetchTopicInsights, type TopicInsights } from '../../services/blogInsights.service';

interface TopicInsightsPanelProps {
  title: string;
  primaryQuery: string;
  contentHtml: string;
  onInsertContent: (html: string) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'unavailable' | 'error';

/**
 * Topic Coverage + Reader Questions (Phase 3). Explicit "Analyze" trigger rather than
 * a typing debounce -- each call is a real, billed Gemini request, so it should only
 * fire when the admin actually wants an analysis, not on every pause while drafting.
 */
export function TopicInsightsPanel({ title, primaryQuery, contentHtml, onInsertContent }: TopicInsightsPanelProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [insights, setInsights] = useState<TopicInsights | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [addedQuestions, setAddedQuestions] = useState<Set<string>>(new Set());

  const topic = (primaryQuery || title).trim();

  const analyze = async () => {
    if (!topic) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await fetchTopicInsights(topic, blogContentPlainText(contentHtml));
      setInsights(result);
      setStatus('success');
    } catch (err) {
      if (err instanceof BlogInsightsUnavailableError) {
        setStatus('unavailable');
      } else {
        setStatus('error');
      }
      setErrorMessage(err instanceof Error ? err.message : 'Could not analyze this article.');
    }
  };

  const addQuestion = (question: string) => {
    onInsertContent(buildFaqBlockHtml(question));
    setAddedQuestions((current) => new Set(current).add(question));
  };

  if (!topic) {
    return <p className="text-sm text-primary-500">Set a title or target query above to analyze topic coverage and reader questions.</p>;
  }

  return (
    <div className="space-y-3">
      {status !== 'success' && (
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={status === 'loading'}
          className="flex min-h-9 items-center gap-1.5 rounded-lg bg-accent-600 px-3 text-xs font-bold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {status === 'loading' ? 'Analyzing…' : 'Analyze'}
        </button>
      )}

      {status === 'unavailable' && (
        <p className="flex items-start gap-2 text-sm text-primary-600"><AlertTriangle className="h-4 w-4 flex-none text-warning-600" />{errorMessage}</p>
      )}
      {status === 'error' && (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger-700"><AlertTriangle className="h-4 w-4 flex-none" />{errorMessage}</p>
      )}

      {status === 'success' && insights && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Topic coverage</h4>
            <ul className="mt-2 space-y-1.5">
              {insights.subtopics.map((subtopic, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-primary-700">
                  {subtopic.covered
                    ? <CheckCircle2 className="h-4 w-4 flex-none text-success-600" />
                    : <Circle className="h-4 w-4 flex-none text-primary-300" />}
                  <span className={subtopic.covered ? '' : 'text-primary-500'}>{subtopic.topic}</span>
                </li>
              ))}
              {insights.subtopics.length === 0 && <li className="text-sm text-primary-500">No subtopics returned.</li>}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Questions readers may have</h4>
            <ul className="mt-2 space-y-1.5">
              {insights.questions.map((question, i) => (
                <li key={i} className="flex items-start justify-between gap-2 rounded-lg border border-primary-100 p-2.5 text-sm text-primary-700">
                  <span>{question}</span>
                  {addedQuestions.has(question)
                    ? <span className="flex-none text-xs font-bold text-success-600">Added</span>
                    : <button type="button" onClick={() => addQuestion(question)} className="flex min-h-8 flex-none items-center gap-1 rounded-lg border border-accent-200 px-2 text-xs font-bold text-accent-700 hover:bg-accent-50"><Plus className="h-3.5 w-3.5" />Add to article</button>}
                </li>
              ))}
              {insights.questions.length === 0 && <li className="text-sm text-primary-500">No questions returned.</li>}
            </ul>
          </div>

          <button type="button" onClick={() => void analyze()} className="text-xs font-bold text-accent-700 hover:underline">Re-analyze</button>
        </div>
      )}
    </div>
  );
}
