'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/utils/format';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'UI/UX', price: '', deadline: '' });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'orders'), {
        ...form,
        price: Number(form.price),
        status: 'open',
        freelancerId: null,
        createdAt: serverTimestamp(),
      });
      toast.success('Order berhasil dibuat!');
      setForm({ title: '', category: 'UI/UX', price: '', deadline: '' });
      setOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Order</h1>
        <button onClick={() => setOpen(!open)} className="btn btn-primary">
          + Buat Order
        </button>
      </div>

      {open && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <input placeholder="Judul Order" className="input" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>UI/UX</option>
            <option>Developer</option>
            <option>Desain Grafis</option>
            <option>Produk Digital</option>
          </select>
          <input type="number" placeholder="Harga (Rp)" className="input" required
            value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input type="date" className="input" required
            value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <button className="btn btn-primary">Simpan Order</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{o.title}</h3>
              <span className="badge bg-blue-100 text-blue-600">{o.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{o.category}</p>
            <p className="font-bold text-blue-600">{formatRupiah(o.price)}</p>
            <p className="text-xs text-gray-400 mt-1">Deadline: {o.deadline}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">Belum ada order.</p>}
      </div>
    </div>
  );
}
