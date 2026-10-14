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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1 text-center">Selamat Datang 👋</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Masuk ke akun Prototipe.id</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="my-4 text-center text-gray-400 text-sm">atau</div>

        <button onClick={handleGoogle} className="btn btn-outline w-full justify-center">
          🔵 Masuk dengan Google
        </button>

        <p className="text-center text-sm mt-6 text-gray-600">
          Belum punya akun? <Link href="/register" className="text-blue-600 font-medium">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
