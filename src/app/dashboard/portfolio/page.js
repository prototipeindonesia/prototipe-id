'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ bio: '', skills: '' });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'freelancer_profiles', user.uid));
      if (snap.exists()) setProfile(snap.data());
    })();
  }, [user]);

  const save = async () => {
    await setDoc(doc(db, 'freelancer_profiles', user.uid), profile, { merge: true });
    toast.success('Profil tersimpan!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Portfolio Saya</h1>
      <div className="card space-y-4">
        <textarea rows={4} placeholder="Bio singkat..." className="input"
          value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        <input placeholder="Skills (pisahkan dengan koma)" className="input"
          value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} />
        <button onClick={save} className="btn btn-primary">Simpan Profil</button>
      </div>
    </div>
  );
}
