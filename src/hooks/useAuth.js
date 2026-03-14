import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function useAuth() {
  // undefined = still resolving, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // Pick up the result if we just returned from a Google redirect
    getRedirectResult(auth).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const signInWithGoogle = () => signInWithRedirect(auth, googleProvider);
  const logout           = () => signOut(auth);

  return { user, signInWithGoogle, logout };
}
