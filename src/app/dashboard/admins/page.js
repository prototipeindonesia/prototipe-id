'use client';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  createAdminBySuperAdmin,
  toggleUserStatus,
  deleteUserDoc,
} from '@/lib/auth';
import toast from 'react-hot-toast';
import { Shield, UserPlus, Trash2, Power, Phone } from 'lucide-react';

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
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

  // =========================================================
  // HANDLE CREATE — dengan Email + WA
  // =========================================================
  const handleCreate = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    // Validasi nomor WA (kalau diisi)
    if (form.phone) {
      const cleaned = form.phone.replace(/[^0-9]/g, '');
      if (cleaned.length < 9 || cleaned.length > 15) {
        toast.error('Nomor WhatsApp tidak valid.');
        return;
      }
    }

    setLoading(true);

    try {
      const result = await createAdminBySuperAdmin(
        form.email,
        form.password,
        form.name,
        form.role,
        form.phone || null
      );

      // Bangun notifikasi berdasarkan hasil
      const delivered = [];
      if (result.emailSent) delivered.push('📧 Email');
      if (result.waSent) delivered.push('📱 WhatsApp');

      if (delivered.length === 2) {
        toast.success(`Admin ${form.name} dibuat & ${delivered.join(' + ')} terkirim! 🎉`);
      } else if (delivered.length === 1) {
        toast.success(`Admin ${form.name} dibuat & ${delivered[0]} terkirim!`);
        // Kasih warning kecil kalau salah satu gagal
        if (form.phone && !result.waSent) {
          toast.error('WA gagal terkirim — kabari manual.');
        }
        if (!result.emailSent) {
          toast.error('Email gagal terkirim — kabari manual.');
        }
      } else {
        toast.success(`Admin ${form.name} dibuat!`);
        toast.error('Email & WA gagal — kabari manual ke admin baru.');
      }

      // Reset form
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        phone: '',
      });
      setShowForm(false);
    } catch (err) {
      let msg = err.message;
      if (msg.includes('email-already-in-use')) {
        msg = 'Email sudah terdaftar. Gunakan email lain.';
      } else if (msg.includes('invalid-email')) {
        msg = 'Format email tidak valid.';
      } else if (msg.includes('weak-password')) {
        msg = 'Password terlalu lemah.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE TOGGLE STATUS
  // =========================================================
  const handleToggle = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleUserStatus(uid, newStatus);
      toast.success(`Status diubah ke ${newStatus}.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // =========================================================
  // HANDLE DELETE
  // =========================================================
  const handleDelete = async (uid, name) => {
    if (!confirm(`Yakin hapus admin ${name}? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    try {
      await deleteUserDoc(uid);
      toast.success('Admin dihapus.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // =========================================================
  // HANDLE RESET FORM SAAT BATAL
  // =========================================================
  const handleCancel = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      phone: '',
    });
    setShowForm(false);
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

      {/* ============================================== */}
      {/* FORM TAMBAH ADMIN */}
      {/* ============================================== */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card space-y-4 border-2 border-blue-200"
        >
          <h3 className="font-semibold">Tambah Admin Baru</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Nama */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Nama admin"
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email@prototipe.id"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Password <span className="text-red-500">*</span>
              </label>
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

            {/* Role */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="admin_super">Super Admin</option>
              </select>
            </div>

            {/* No. WhatsApp — FULL WIDTH */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                <Phone size={14} />
                No. WhatsApp
                <span className="text-xs text-gray-400 font-normal">
                  (opsional — untuk kirim kredensial otomatis)
                </span>
              </label>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 08xxx atau 62xxx. Kosongkan kalau tidak mau kirim WA.
              </p>
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
              onClick={handleCancel}
              className="btn btn-outline"
            >
              Batal
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-700 space-y-1">
            <p className="font-semibold">⚠️ Perhatian:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                Kredensial akan dikirim via <strong>Email + WhatsApp</strong> (kalau
                nomor diisi).
              </li>
              <li>
                Kalau pengiriman gagal, Anda perlu <strong>kabari manual</strong>{' '}
                ke admin baru.
              </li>
              <li>Password tidak bisa dilihat lagi setelah dibuat.</li>
            </ul>
          </div>
        </form>
      )}

      {/* ============================================== */}
      {/* DAFTAR ADMIN */}
      {/* ============================================== */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((a) => {
          const isMe = a.uid === user?.uid;
          return (
            <div key={a.id} className="card relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {a.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                    <span className="truncate">{a.name}</span>
                    {isMe && (
                      <span className="badge bg-blue-100 text-blue-600">
                        Anda
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{a.email}</p>
                  {a.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={10} />
                      {a.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mb-3 flex-wrap">
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
                    title="Hapus admin"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {admins.length === 0 && (
          <div className="card col-span-full text-center py-12">
            <Shield size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}