'use client';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { createAdminBySuperAdmin, toggleUserStatus, deleteUserDoc } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Shield, UserPlus, Trash2, Power } from 'lucide-react';

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'admin_super'])
    );
    const unsub = onSnapshot(q, (snap) => {
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      await createAdminBySuperAdmin(form.email, form.password, form.name, form.role);
      toast.success(`Admin ${form.name} berhasil dibuat!`);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setShowForm(false);
    } catch (err) {
      let msg = err.message;
      if (msg.includes('email-already-in-use')) {
        msg = 'Email sudah terdaftar.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleUserStatus(uid, newStatus);
      toast.success(`Status diubah ke ${newStatus}.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Yakin hapus admin ${name}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteUserDoc(uid);
      toast.success('Admin dihapus.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-blue-600" /> Manajemen Admin
          </h1>
          <p className="text-gray-500 text-sm">
            Tambah & kelola akun admin. Hanya Super Admin yang bisa akses.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <UserPlus size={18} /> Tambah Admin
        </button>
      </div>

      {/* Form Tambah Admin */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4 border-2 border-blue-200">
          <h3 className="font-semibold">Tambah Admin Baru</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama Lengkap</label>
              <input
                placeholder="Nama admin"
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                placeholder="email@prototipe.id"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                className="input"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="admin_super">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Membuat...' : 'Simpan Admin'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-outline"
            >
              Batal
            </button>
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Pastikan email & password disampaikan ke admin baru.
            Password tidak bisa dilihat lagi setelah dibuat.
          </p>
        </form>
      )}

      {/* Daftar Admin */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((a) => {
          const isMe = a.uid === user?.uid;
          return (
            <div key={a.id} className="card relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {a.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {a.name}
                    {isMe && <span className="badge bg-blue-100 text-blue-600">Anda</span>}
                  </h3>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <span
                  className={`badge ${
                    a.role === 'admin_super'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {a.role === 'admin_super' ? 'Super Admin' : 'Admin'}
                </span>
                <span
                  className={`badge ${
                    a.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {a.status}
                </span>
              </div>

              {!isMe && (
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleToggle(a.uid, a.status)}
                    className="btn btn-outline text-xs flex-1 justify-center"
                  >
                    <Power size={14} />
                    {a.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => handleDelete(a.uid, a.name)}
                    className="btn btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {admins.length === 0 && (
          <p className="text-gray-500">Belum ada admin.</p>
        )}
      </div>
    </div>
  );
}