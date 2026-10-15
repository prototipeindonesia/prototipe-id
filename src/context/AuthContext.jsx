'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        // Realtime listener ke dokumen user
        const unsubDoc = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setRole(data.role);
            setStatus(data.status);
            // Auto-logout jika status inactive
            if (data.status !== 'active') {
              signOut(auth);
            }
          } else {
            // User tidak ada di Firestore → logout
            signOut(auth);
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setRole(null);
        setStatus(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);