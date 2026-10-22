import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { Skill, SkillListResponse, SkillCreate, SkillUpdate, SkillOverride, SkillOverrideCreate } from '../types';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [effectiveSkills, setEffectiveSkills] = useState<Skill[]>([]);
  const [overrides, setOverrides] = useState<SkillOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 });

  const fetchSkills = useCallback(async (params?: { level?: string; search?: string; page?: number; page_size?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSkills(params) as SkillListResponse;
      setSkills(data.items);
      setPagination(prev => ({ ...prev, page: data.page, page_size: data.page_size, total: data.total }));
    } catch (err) {
      setError('Failed to fetch skills');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEffectiveSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEffectiveSkills() as Skill[];
      setEffectiveSkills(data);
    } catch (err) {
      setError('Failed to fetch effective skills');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverrides = useCallback(async () => {
    try {
      const data = await api.listOverrides() as SkillOverride[];
      setOverrides(data);
    } catch (err) {
      setError('Failed to fetch overrides');
      throw err;
    }
  }, []);

  const createSkill = useCallback(async (data: SkillCreate) => {
    setLoading(true);
    try {
      const skill = await api.createSkill(data) as Skill;
      setSkills(prev => [skill, ...prev]);
      return skill;
    } catch (err) {
      setError('Failed to create skill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSkill = useCallback(async (id: number, data: SkillUpdate) => {
    setLoading(true);
    try {
      const skill = await api.updateSkill(id, data) as Skill;
      setSkills(prev => prev.map(s => s.id === id ? skill : s));
      return skill;
    } catch (err) {
      setError('Failed to update skill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSkill = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete skill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOverride = useCallback(async (data: SkillOverrideCreate) => {
    setLoading(true);
    try {
      const override = await api.createOverride(data) as SkillOverride;
      setOverrides(prev => [...prev, override]);
      return override;
    } catch (err) {
      setError('Failed to create override');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOverride = useCallback(async (skillName: string) => {
    setLoading(true);
    try {
      await api.deleteOverride(skillName);
      setOverrides(prev => prev.filter(o => o.skill_name !== skillName));
    } catch (err) {
      setError('Failed to delete override');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    skills,
    effectiveSkills,
    overrides,
    loading,
    error,
    pagination,
    fetchSkills,
    fetchEffectiveSkills,
    fetchOverrides,
    createSkill,
    updateSkill,
    deleteSkill,
    createOverride,
    deleteOverride,
  };
}