import { useState, useCallback } from 'react';

const KEY_PROFILES = 'wuxi_profiles';
const KEY_CURRENT  = 'wuxi_current_profile';

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(KEY_PROFILES)) || []; }
  catch { return []; }
}

export default function useProfiles() {
  const [profiles,  setProfiles]  = useState(loadProfiles);
  const [currentId, setCurrentId] = useState(
    () => localStorage.getItem(KEY_CURRENT) || null
  );

  const currentProfile = profiles.find(p => p.id === currentId) || null;

  const createProfile = useCallback((name, avatar) => {
    const id = 'profile_' + Date.now();
    const profile = { id, name, avatar, createdAt: Date.now() };
    setProfiles(prev => {
      const next = [...prev, profile];
      localStorage.setItem(KEY_PROFILES, JSON.stringify(next));
      return next;
    });
    localStorage.setItem(KEY_CURRENT, id);
    setCurrentId(id);
    return id;
  }, []);

  const selectProfile = useCallback((id) => {
    localStorage.setItem(KEY_CURRENT, id);
    setCurrentId(id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY_CURRENT);
    setCurrentId(null);
  }, []);

  const deleteProfile = useCallback((id) => {
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(KEY_PROFILES, JSON.stringify(next));
      return next;
    });
    localStorage.removeItem(`wuxi_mastery_${id}`);
    if (currentId === id) {
      localStorage.removeItem(KEY_CURRENT);
      setCurrentId(null);
    }
  }, [currentId]);

  return { profiles, currentProfile, createProfile, selectProfile, logout, deleteProfile };
}
