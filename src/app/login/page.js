'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { loginUser, loginWithGoogle } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (err) {
      let msg = err.message;
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        msg = 'Email atau password salah.';
      } else if (msg.includes('user-not-found')) {
        msg = 'Akun tidak ditemukan.';
      } else if (msg.includes('too-many-requests')) {
        msg = 'Terlalu banyak percobaan. Coba lagi nanti.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      toast.success('Login Google berhasil!');
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
          <h1 className="text-2xl font-bold mb-1">Selamat Datang 👋</h1>
          <p className="text-gray-500 text-sm">Masuk ke akun Prototipe.id</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                className="input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="my-4 text-center text-gray-400 text-sm">atau</div>

        <button
          onClick={handleGoogle}
          className="btn btn-outline w-full justify-center"
        >
          🔵 Masuk dengan Google
        </button>

        <p className="text-center text-sm mt-6 text-gray-600">
          Belum punya akun?{' '}
          <Link href="/register" className="text-blue-600 font-medium">
            Daftar Freelancer
          </Link>
        </p>

        <div className="border-t mt-6 pt-4">
          <p className="text-xs text-center text-gray-500">
            🔒 Admin tidak dapat mendaftar sendiri. Hubungi Super Admin.
          </p>
        </div>
      </div>
    </div>
  );
}