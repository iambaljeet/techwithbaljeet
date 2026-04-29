'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);
  return { user, loading: user === undefined };
}
