'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { registerFreelancer, loginWithGoogle } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      toast.error('Harap setujui syarat & ketentuan.');
      return;
    }
    setLoading(true);
    try {
      await registerFreelancer(form.email, form.password, form.name);
      toast.success('Registrasi berhasil! Selamat datang.');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!agree) {
      toast.error('Harap setujui syarat & ketentuan.');
      return;
    }
    try {
      await loginWithGoogle();
      toast.success('Berhasil masuk dengan Google!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Daftar Freelancer</h1>
          <p className="text-gray-500 text-sm">
            Bergabung dan mulai hasilkan dari keahlianmu
          </p>
        </div>

        {/* Info bahwa hanya freelancer */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
          ℹ️ Halaman ini untuk pendaftaran <strong>Freelancer</strong>.
          Untuk akun Admin, hubungi Super Admin.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nama Lengkap
            </label>
            <input
              placeholder="Masukkan nama lengkap"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {/* Role info (readonly) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Daftar Sebagai
            </label>
            <div className="input bg-gray-50 text-gray-600 flex items-center gap-2">
              <span className="badge bg-green-100 text-green-700">Freelancer</span>
              <span className="text-xs">(otomatis)</span>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <span>
              Saya setuju dengan{' '}
              <span className="text-blue-600 font-medium">Syarat & Ketentuan</span>{' '}
              dan{' '}
              <span className="text-blue-600 font-medium">Kebijakan Privasi</span>{' '}
              Prototipe.id
            </span>
          </label>

          <button
            disabled={loading || !agree}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar sebagai Freelancer'}
          </button>
        </form>

        <div className="my-4 text-center text-gray-400 text-sm">atau</div>

        <button
          onClick={handleGoogle}
          disabled={!agree}
          className="btn btn-outline w-full justify-center disabled:opacity-50"
        >
          🔵 Daftar dengan Google
        </button>

        <p className="text-center text-sm mt-6 text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            Masuk
          </Link>
        </p>

        <div className="border-t mt-6 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Anda Admin?{' '}
            <span className="text-gray-700 font-medium">
              Minta Super Admin untuk membuatkan akun Anda
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}