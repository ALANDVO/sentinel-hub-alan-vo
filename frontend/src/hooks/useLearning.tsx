import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { Lesson, LessonListResponse, UserProgress } from '../types';

export function useLearning() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listLessons() as LessonListResponse;
      setLessons(data.items);
    } catch (err) {
      setError('Failed to fetch lessons');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const data = await api.getMyProgress() as UserProgress[];
      setProgress(data);
    } catch (err) {
      setError('Failed to fetch progress');
      throw err;
    }
  }, []);

  const submitProgress = useCallback(async (lessonId: number, score: number) => {
    setLoading(true);
    try {
      const result = await api.submitProgress(lessonId, score) as UserProgress;
      setProgress(prev => {
        const existing = prev.findIndex(p => p.lesson_id === lessonId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = result;
          return updated;
        }
        return [...prev, result];
      });
      return result;
    } catch (err) {
      setError('Failed to submit progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLessonProgress = useCallback((lessonId: number) => {
    return progress.find(p => p.lesson_id === lessonId);
  }, [progress]);

  const isLessonCompleted = useCallback((lessonId: number) => {
    const p = progress.find(p => p.lesson_id === lessonId);
    return p?.completed ?? false;
  }, [progress]);

  const getLessonScore = useCallback((lessonId: number) => {
    const p = progress.find(p => p.lesson_id === lessonId);
    return p?.score ?? null;
  }, [progress]);

  return {
    lessons,
    progress,
    loading,
    error,
    fetchLessons,
    fetchProgress,
    submitProgress,
    getLessonProgress,
    isLessonCompleted,
    getLessonScore,
  };
}