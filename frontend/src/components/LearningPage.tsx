import { useEffect } from 'react';
import { useLearning } from '../hooks/useLearning';
import { Lesson } from '../types';

export function LearningPage() {
  const { lessons, loading, error, fetchLessons, fetchProgress, submitProgress, isLessonCompleted, getLessonScore } = useLearning();

  useEffect(() => {
    fetchLessons();
    fetchProgress();
  }, [fetchLessons, fetchProgress]);

  if (loading && lessons.length === 0) {
    return <div className="empty-state">Loading lessons...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning Path</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Progress through lessons and quizzes to master Claude Code skills.
          </p>
        </div>
      </div>

      {error && <div className="card mb-6" style={{ borderColor: 'var(--color-error)', background: '#fef2f2' }}>{error}</div>}

      {lessons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">\uD83D\uDCDA</div>
          <h3>No lessons available</h3>
          <p>Lessons will appear here once configured.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={isLessonCompleted(lesson.id)}
              score={getLessonScore(lesson.id)}
              onSubmit={submitProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LessonCardProps {
  lesson: Lesson;
  completed: boolean;
  score: number | null;
  onSubmit: (lessonId: number, score: number) => Promise<UserProgress>;
}

function LessonCard({ lesson, completed, score, onSubmit }: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (lesson.questions.length === 0) return;
    let correct = 0;
    lesson.questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / lesson.questions.length) * 100);
    setResult({ score, correct, total: lesson.questions.length });
    setSubmitted(true);
    await onSubmit(lesson.id, score);
  };

  const statusBadge = completed
    ? <span className="badge badge-on">Completed</span>
    : submitted
    ? <span className="badge badge-name-only">Submitted</span>
    : <span className="badge badge-off">Not Started</span>;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          {lesson.level && <span className={`badge badge-${lesson.level.toLowerCase()} ml-2`}>{lesson.level}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {statusBadge}
          {score !== null && <span className="text-sm text-[var(--color-text-muted)]">Score: {score}%</span>}
        </div>
      </div>

      {lesson.description && <p className="text-[var(--color-text-muted)] mb-4">{lesson.description}</p>}

      <button
        className="btn btn-ghost"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide Content' : 'Show Content'}
      </button>

      {expanded && (
        <div className="mt-4" style={{ animation: 'slideDown 0.2s ease' }}>
          {lesson.content && (
            <div className="prose max-w-none mb-6" style={{ whiteSpace: 'pre-wrap' }}>
              {lesson.content}
            </div>
          )}

          {lesson.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Quiz</h3>
              {submitted && result ? (
                <div className="p-4 rounded-lg bg-[var(--color-bg)] mb-4">
                  <div className="text-2xl font-bold text-[var(--color-primary)]">{result.score}%</div>
                  <div className="text-[var(--color-text-muted)]">{result.correct} of {result.total} correct</div>
                  {result.score >= 70 ? (
                    <div className="text-[var(--color-success)] mt-2">\u2713 Passed! Lesson marked as completed.</div>
                  ) : (
                    <div className="text-[var(--color-error)] mt-2">\u2717 Below 70%. Review the material and try again.</div>
                  )}
                  <button className="btn btn-secondary mt-4" onClick={() => { setSubmitted(false); setAnswers({}); setResult(null); }}>
                    Retry Quiz
                  </button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleSubmitQuiz(); }}>
                  {lesson.questions.map((question, idx) => (
                    <div key={question.id} className="mb-6 p-4 bg-[var(--color-bg)] rounded-lg">
                      <p className="font-medium mb-3">{idx + 1}. {question.question}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {question.options.map((option, optIdx) => (
                          <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              value={optIdx}
                              checked={answers[question.id] === optIdx}
                              onChange={() => handleAnswerChange(question.id, optIdx)}
                              className="w-4 h-4 text-[var(--color-primary)]"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary" disabled={Object.keys(answers).length < lesson.questions.length}>
                    Submit Quiz
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { UserProgress } from '../types';