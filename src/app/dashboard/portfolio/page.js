'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePortfolio,
  deletePortfolioItem,
  saveProfile,
} from '@/lib/portfolio';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { updateDoc } from 'firebase/firestore';
import PortfolioUpload from '@/components/PortfolioUpload';
import toast from 'react-hot-toast';
import {
  User,
  Upload,
  Trash2,
  Camera,
  Image as ImageIcon,
  Edit3,
  Save,
  Briefcase,
} from 'lucide-react';

export default function PortfolioPage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState({
    bio: '',
    skills: '',
    avatar: '',
    tagline: '',
    name: '',
    email: '',
  });
  const [portfolio, setPortfolio] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Load profil
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setProfile({ ...snap.data() });
      }
    })();
  }, [user]);

  // Load portfolio realtime
  useEffect(() => {
    if (!user) return;
    const unsub = subscribePortfolio(user.uid, setPortfolio);
    return () => unsub();
  }, [user]);

  // Upload avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran avatar maksimal 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'users', user.uid), {
        avatar: result.secure_url,
      });
      setProfile({ ...profile, avatar: result.secure_url });
      toast.success('Avatar berhasil diperbarui!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Simpan profil
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        bio: profile.bio,
        skills: profile.skills,
        avatar: profile.avatar,
        tagline: profile.tagline,
      });
      toast.success('Profil tersimpan!');
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hapus portfolio item
  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus karya ini?')) return;
    try {
      await deletePortfolioItem(id);
      toast.success('Karya dihapus.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (role !== 'freelancer') {
    return (
      <div className="card text-center py-12">
        <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">
          Halaman ini hanya untuk freelancer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ============================================ */}
      {/* HEADER PROFIL */}
      {/* ============================================ */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-blue-600">
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-sm text-gray-500">{profile.email}</p>
                {profile.tagline && !editing && (
                  <p className="text-sm text-blue-600 mt-1 italic">
                    "{profile.tagline}"
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="btn btn-outline text-xs"
              >
                {editing ? <Save size={14} /> : <Edit3 size={14} />}
                {editing ? 'Batal' : 'Edit'}
              </button>
            </div>

            {/* Form Edit */}
            {editing ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Tagline
                  </label>
                  <input
                    placeholder="Contoh: UI/UX Designer & Frontend Dev"
                    className="input"
                    value={profile.tagline || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, tagline: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Bio</label>
                  <textarea
                    rows={3}
                    placeholder="Ceritakan pengalaman & keahlian Anda..."
                    className="input"
                    value={profile.bio || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Skills (pisahkan dengan koma)
                  </label>
                  <input
                    placeholder="Figma, React, Photoshop, Canva"
                    className="input"
                    value={profile.skills || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, skills: e.target.value })
                    }
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {profile.bio && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Bio
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {profile.skills && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.split(',').map((s, i) => (
                        <span
                          key={i}
                          className="badge bg-blue-100 text-blue-700"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TOMBOL TAMBAH KARYA */}
      {/* ============================================ */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Portfolio Saya</h2>
          <p className="text-sm text-gray-500">
            {portfolio.length} karya dipamerkan
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary"
        >
          <Upload size={16} />
          {showUpload ? 'Tutup' : 'Tambah Karya'}
        </button>
      </div>

      {/* ============================================ */}
      {/* FORM UPLOAD */}
      {/* ============================================ */}
      {showUpload && (
        <PortfolioUpload
          onSuccess={() => setShowUpload(false)}
        />
      )}

      {/* ============================================ */}
      {/* GRID PORTFOLIO */}
      {/* ============================================ */}
      {portfolio.length === 0 && !showUpload && (
        <div className="card text-center py-12">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            Belum ada karya
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Upload karya terbaik Anda untuk menarik perhatian klien
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-primary mx-auto"
          >
            <Upload size={16} /> Upload Karya Pertama
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolio.map((item) => (
          <div
            key={item.id}
            className="card p-0 overflow-hidden group relative"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
              <span className="absolute bottom-2 left-2 badge bg-black/70 text-white text-xs">
                {item.category}
              </span>
            </div>

            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}