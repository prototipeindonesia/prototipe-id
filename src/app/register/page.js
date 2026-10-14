'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { registerUser } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'freelancer' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form.email, form.password, form.name, form.role);
      toast.success('Registrasi berhasil!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1 text-center">Buat Akun Baru</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Gabung bersama Prototipe.id</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Nama Lengkap" className="input"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" className="input"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password (min. 6)" className="input"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className="input"
            value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="freelancer">Freelancer</option>
            <option value="admin">Admin</option>
            <option value="admin_super">Admin Super</option>
          </select>

          <button disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Sudah punya akun? <Link href="/login" className="text-blue-600 font-medium">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
