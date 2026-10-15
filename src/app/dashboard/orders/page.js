'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logActivity } from '@/lib/audit';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/utils/format';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  RotateCcw,
  Star,
  FileText,
  User,
  Calendar,
  X,
} from 'lucide-react';
import RatingModal from '@/components/RatingModal';

const CATEGORIES = ['UI/UX', 'Developer', 'Desain Grafis', 'Produk Digital'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'open', label: 'Open (Belum diambil)' },
  { value: 'in_progress', label: 'Dikerjakan' },
  { value: 'review', label: 'Review' },
  { value: 'revision', label: 'Revisi' },
  { value: 'completed', label: 'Selesai' },
];

const STATUS_STYLE = {
  open: { bg: 'bg-green-100 text-green-700', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100 text-yellow-700', label: 'Dikerjakan' },
  review: { bg: 'bg-blue-100 text-blue-700', label: 'Review' },
  revision: { bg: 'bg-orange-100 text-orange-700', label: 'Revisi' },
  completed: { bg: 'bg-gray-100 text-gray-700', label: 'Selesai' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [freelancerCache, setFreelancerCache] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [ratingOrder, setRatingOrder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: 'UI/UX',
    price: '',
    deadline: '',
    description: '',
  });

  // =========================================================
  // LOAD ORDERS
  // =========================================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort manual by createdAt desc
      list.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      setOrders(list);
    });
    return () => unsub();
  }, []);

  // =========================================================
  // CACHE DATA FREELANCER
  // =========================================================
  useEffect(() => {
    const fetchFreelancers = async () => {
      const ids = [
        ...new Set(orders.map((o) => o.freelancerId).filter(Boolean)),
      ];
      const newCache = { ...freelancerCache };
      for (const id of ids) {
        if (!newCache[id]) {
          try {
            const snap = await getDoc(doc(db, 'users', id));
            if (snap.exists()) {
              newCache[id] = snap.data();
            }
          } catch (_) {}
        }
      }
      setFreelancerCache(newCache);
    };
    if (orders.length > 0) fetchFreelancers();
  }, [orders]);

  // =========================================================
  // FILTER & SEARCH
  // =========================================================
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.category?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchCategory =
        filterCategory === 'all' || o.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [orders, search, filterStatus, filterCategory]);

  // =========================================================
  // BUAT ORDER
  // =========================================================
  const handleCreate = async (e) => {
    e.preventDefault();

    if (Number(form.price) <= 0) {
      toast.error('Harga harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        title: form.title,
        category: form.category,
        price: Number(form.price),
        deadline: form.deadline,
        description: form.description || '',
        status: 'open',
        freelancerId: null,
        createdAt: serverTimestamp(),
      });

      // 📋 Audit log
      await logActivity({
        action: 'CREATE_ORDER',
        targetType: 'order',
        targetId: docRef.id,
        targetName: form.title,
        details: {
          category: form.category,
          price: Number(form.price),
          deadline: form.deadline,
        },
      });

      toast.success('Order berhasil dibuat!');
      setForm({
        title: '',
        category: 'UI/UX',
        price: '',
        deadline: '',
        description: '',
      });
      setShowForm(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPDATE STATUS ORDER
  // =========================================================
  const updateOrderStatus = async (order, newStatus, note = '') => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(note ? { adminNote: note } : {}),
      });

      // 📋 Audit log
      await logActivity({
        action: newStatus === 'completed' ? 'APPROVE_ORDER' : 'UPDATE_ORDER',
        targetType: 'order',
        targetId: order.id,
        targetName: order.title,
        details: { from: order.status, to: newStatus },
      });

      toast.success(`Status order diubah ke "${STATUS_STYLE[newStatus]?.label || newStatus}".`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // =========================================================
  // HAPUS ORDER
  // =========================================================
  const handleDelete = async (order) => {
    if (
      !confirm(
        `Yakin hapus order "${order.title}"? Tindakan ini tidak bisa dibatalkan.`
      )
    )
      return;

    try {
      await deleteDoc(doc(db, 'orders', order.id));

      // 📋 Audit log
      await logActivity({
        action: 'DELETE_ORDER',
        targetType: 'order',
        targetId: order.id,
        targetName: order.title,
        details: { category: order.category, price: order.price },
      });

      toast.success('Order dihapus.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Order</h1>
          <p className="text-gray-500 text-sm">
            Kelola semua order dari klien — assign, review, approve.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus size={18} /> Buat Order
        </button>
      </div>

      {/* ============================================ */}
      {/* FORM BUAT ORDER */}
      {/* ============================================ */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card space-y-4 border-2 border-blue-200"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Buat Order Baru</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">
                Judul Order <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Contoh: Desain Logo Company PT ABC"
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="500000"
                className="input"
                required
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">
                Deskripsi / Brief (opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Detail brief dari klien..."
                className="input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Order'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-outline"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ============================================ */}
      {/* FILTER & SEARCH */}
      {/* ============================================ */}
      <div className="card grid md:grid-cols-3 gap-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Cari judul order..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            className="input pl-10"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <select
          className="input"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">
        Menampilkan {filtered.length} dari {orders.length} order
      </p>

      {/* ============================================ */}
      {/* DAFTAR ORDER */}
      {/* ============================================ */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((o) => {
          const freelancer = o.freelancerId
            ? freelancerCache[o.freelancerId]
            : null;
          const style = STATUS_STYLE[o.status] || {
            bg: 'bg-gray-100 text-gray-600',
            label: o.status,
          };

          return (
            <div key={o.id} className="card flex flex-col">
              {/* Title & Status */}
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold flex-1">{o.title}</h3>
                <span className={`badge ${style.bg} flex-shrink-0`}>
                  {style.label}
                </span>
              </div>

              {/* Category & Price */}
              <p className="text-sm text-gray-500">{o.category}</p>
              <p className="font-bold text-blue-600 text-lg">
                {formatRupiah(o.price)}
              </p>

              {/* Deadline */}
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar size={12} /> {o.deadline}
              </p>

              {/* Freelancer Info */}
              {freelancer ? (
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {freelancer.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">
                      {freelancer.name}
                    </p>
                    <p className="text-xs text-gray-400">Freelancer</p>
                  </div>
                </div>
              ) : o.status !== 'open' ? (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t flex items-center gap-1">
                  <User size={12} /> Belum ada freelancer
                </p>
              ) : null}

              {/* Files */}
              {o.files && o.files.length > 0 && (
                <button
                  onClick={() => setSelectedFiles(o)}
                  className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText size={12} /> Lihat {o.files.length} file hasil kerja
                </button>
              )}

              {/* Actions */}
              <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                {o.status === 'review' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(o, 'completed')}
                      className="btn btn-primary text-xs flex-1 justify-center"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          o,
                          'revision',
                          'Perlu perbaikan sesuai brief.'
                        )
                      }
                      className="btn btn-outline text-xs flex-1 justify-center"
                    >
                      <RotateCcw size={14} /> Revisi
                    </button>
                  </>
                )}

                {o.status === 'completed' && !o.rating && (
                  <button
                    onClick={() => setRatingOrder(o)}
                    className="btn btn-outline text-xs flex-1 justify-center"
                  >
                    <Star size={14} /> Beri Rating
                  </button>
                )}

                {o.status === 'completed' && o.rating && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{o.rating}/5</span>
                  </div>
                )}

                {o.status !== 'completed' && (
                  <button
                    onClick={() => handleDelete(o)}
                    className="btn btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                    title="Hapus order"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && orders.length === 0 && (
          <div className="card col-span-full text-center py-12">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada order.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4 mx-auto"
            >
              <Plus size={16} /> Buat Order Pertama
            </button>
          </div>
        )}

        {filtered.length === 0 && orders.length > 0 && (
          <p className="text-gray-500 col-span-full text-center py-12">
            Tidak ada order yang cocok dengan filter Anda.
          </p>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL RATING */}
      {/* ============================================ */}
      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
        />
      )}

      {/* ============================================ */}
      {/* MODAL FILES */}
      {/* ============================================ */}
      {selectedFiles && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFiles(null)}
        >
          <div
            className="card max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">
                File Hasil Kerja — {selectedFiles.title}
              </h3>
              <button
                onClick={() => setSelectedFiles(null)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {selectedFiles.files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <FileText className="text-blue-600" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {f.uploadedAt
                        ? new Date(f.uploadedAt).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}