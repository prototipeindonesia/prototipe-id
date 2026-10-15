'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/StatCard';
import { formatRupiah } from '@/utils/format';
import ChatButton from '@/components/ChatButton';
import Link from 'next/link';
import {
  ShoppingBag,
  Users,
  Briefcase,
  Wallet,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  ArrowRight,
  Activity,
  MessageCircle,
} from 'lucide-react';

// =========================================================
// KONFIGURASI STATUS ORDER
// =========================================================
const STATUS_STYLE = {
  open: { bg: 'bg-green-100 text-green-700', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100 text-yellow-700', label: 'Dikerjakan' },
  review: { bg: 'bg-blue-100 text-blue-700', label: 'Review' },
  revision: { bg: 'bg-orange-100 text-orange-700', label: 'Revisi' },
  completed: { bg: 'bg-gray-100 text-gray-700', label: 'Selesai' },
};

// =========================================================
// KOMPONEN UTAMA
// =========================================================
export default function DashboardPage() {
  const { role, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // REALTIME LISTENERS
  // =========================================================
  useEffect(() => {
    // Orders
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => console.error('Orders error:', err)
    );

    // Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error('Users error:', err)
    );

    // Reviews
    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error('Reviews error:', err)
    );

    // Load Super Admin untuk tombol chat
    (async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'admin_super')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setSuperAdmin({ id: doc.id, ...doc.data() });
        }
      } catch (err) {
        console.error('Load super admin error:', err);
      }
    })();

    return () => {
      unsubOrders();
      unsubUsers();
      unsubReviews();
    };
  }, []);

  // =========================================================
  // STATISTIK GLOBAL
  // =========================================================
  const stats = useMemo(() => {
    const freelancers = users.filter((u) => u.role === 'freelancer');
    const admins = users.filter(
      (u) => u.role === 'admin' || u.role === 'admin_super'
    );

    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (o.price || 0), 0);

    const pending = orders.filter((o) =>
      ['open', 'in_progress', 'review', 'revision'].includes(o.status)
    );

    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : '0.0';

    return {
      totalOrders: orders.length,
      totalFreelancers: freelancers.length,
      totalAdmins: admins.length,
      totalUsers: users.length,
      revenue,
      pendingCount: pending.length,
      completedCount: orders.filter((o) => o.status === 'completed').length,
      avgRating,
      totalReviews: reviews.length,
    };
  }, [orders, users, reviews]);

  // =========================================================
  // STATISTIK KHUSUS FREELANCER
  // =========================================================
  const myStats = useMemo(() => {
    if (role !== 'freelancer' || !user) return null;

    const myOrders = orders.filter((o) => o.freelancerId === user.uid);
    const completed = myOrders.filter((o) => o.status === 'completed');
    const active = myOrders.filter((o) =>
      ['in_progress', 'review', 'revision'].includes(o.status)
    );

    const earnings = completed.reduce((sum, o) => sum + (o.price || 0), 0);

    const myReviews = reviews.filter((r) => r.freelancerId === user.uid);
    const myRating =
      myReviews.length > 0
        ? (
            myReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            myReviews.length
          ).toFixed(1)
        : '0.0';

    return {
      totalOrders: myOrders.length,
      activeCount: active.length,
      completedCount: completed.length,
      earnings,
      myRating,
      totalReviews: myReviews.length,
    };
  }, [orders, reviews, role, user]);

  // =========================================================
  // ORDER TERBARU (max 5)
  // =========================================================
  const recentOrders = useMemo(() => {
    let list = [...orders];
    if (role === 'freelancer' && user) {
      list = list.filter((o) => o.freelancerId === user.uid);
    }
    return list
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [orders, role, user]);

  // =========================================================
  // TOP FREELANCER (khusus admin)
  // =========================================================
  const topFreelancers = useMemo(() => {
    if (role === 'freelancer') return [];
    return users
      .filter((u) => u.role === 'freelancer')
      .map((u) => ({
        ...u,
        completedOrders: orders.filter(
          (o) => o.freelancerId === u.uid && o.status === 'completed'
        ).length,
        earnings: orders
          .filter((o) => o.freelancerId === u.uid && o.status === 'completed')
          .reduce((sum, o) => sum + (o.price || 0), 0),
      }))
      .sort((a, b) => b.completedOrders - a.completedOrders)
      .slice(0, 5);
  }, [users, orders, role]);

  // =========================================================
  // ORDER PER KATEGORI
  // =========================================================
  const categoryStats = useMemo(() => {
    const cats = ['UI/UX', 'Developer', 'Desain Grafis', 'Produk Digital'];
    const map = {};
    cats.forEach((c) => (map[c] = 0));
    orders.forEach((o) => {
      if (map[o.category] !== undefined) map[o.category]++;
    });
    const total = orders.length || 1;
    return cats.map((c) => ({
      name: c,
      count: map[c],
      percent: Math.round((map[c] / total) * 100),
    }));
  }, [orders]);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* WELCOME HEADER */}
      {/* ============================================ */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Halo, {user?.displayName || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 text-sm capitalize">
            {role === 'admin_super'
              ? 'Super Admin Dashboard'
              : role === 'admin'
              ? 'Admin Dashboard'
              : 'Freelancer Dashboard'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {role === 'freelancer' && superAdmin && (
            <ChatButton
              targetUserId={superAdmin.id}
              targetName={superAdmin.name}
              label="Chat Admin"
              className="btn btn-outline justify-center"
            />
          )}
          {role === 'freelancer' && (
            <Link href="/dashboard/job-board" className="btn btn-primary">
              <Briefcase size={16} /> Cari Order
            </Link>
          )}
          {(role === 'admin' || role === 'admin_super') && (
            <Link href="/dashboard/orders" className="btn btn-primary">
              <Plus size={16} /> Buat Order
            </Link>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* DASHBOARD FREELANCER */}
      {/* ============================================ */}
      {role === 'freelancer' && myStats && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Order Aktif"
              value={myStats.activeCount}
              icon={Clock}
              color="accent"
            />
            <StatCard
              title="Selesai"
              value={myStats.completedCount}
              icon={CheckCircle}
              color="secondary"
            />
            <StatCard
              title="Pendapatan"
              value={formatRupiah(myStats.earnings)}
              icon={Wallet}
              color="primary"
            />
            <StatCard
              title={`Rating (${myStats.totalReviews})`}
              value={myStats.myRating}
              icon={Star}
              color="accent"
            />
          </div>

          {/* Info Card Tips */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Tips untuk Freelancer</h3>
                <p className="text-sm text-gray-600">
                  Ambil order sebanyak mungkin untuk tingkatkan rating.
                  Freelancer dengan rating tinggi diprioritaskan dapat order
                  dari admin!
                </p>
              </div>
            </div>
          </div>

          {/* 🆕 Chat Admin */}
          {superAdmin && (
            <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Butuh Bantuan?</h3>
                  <p className="text-sm text-gray-600">
                    Chat langsung dengan admin{' '}
                    <span className="font-medium">{superAdmin.name}</span>
                  </p>
                </div>
              </div>
              <ChatButton
                targetUserId={superAdmin.id}
                targetName={superAdmin.name}
                label="Mulai Chat"
                className="btn btn-primary justify-center"
              />
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* DASHBOARD ADMIN & SUPER ADMIN */}
      {/* ============================================ */}
      {(role === 'admin' || role === 'admin_super') && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Order"
              value={stats.totalOrders}
              icon={ShoppingBag}
              color="primary"
            />
            <StatCard
              title="Order Aktif"
              value={stats.pendingCount}
              icon={Clock}
              color="accent"
            />
            <StatCard
              title="Freelancer"
              value={stats.totalFreelancers}
              icon={Briefcase}
              color="secondary"
            />
            <StatCard
              title="Pendapatan"
              value={formatRupiah(stats.revenue)}
              icon={Wallet}
              color="primary"
            />
          </div>

          {/* Statistik Tambahan */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-600" />
                <p className="text-sm text-gray-500">Order Selesai</p>
              </div>
              <p className="text-2xl font-bold">{stats.completedCount}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-yellow-500" />
                <p className="text-sm text-gray-500">Rating Rata-rata</p>
              </div>
              <p className="text-2xl font-bold">{stats.avgRating}</p>
              <p className="text-xs text-gray-400">
                dari {stats.totalReviews} review
              </p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-blue-600" />
                <p className="text-sm text-gray-500">Total User</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-gray-400">
                {stats.totalAdmins} admin
              </p>
            </div>
          </div>

          {/* Kategori Breakdown */}
          <div className="card">
            <h3 className="font-semibold mb-4">Order per Kategori</h3>
            <div className="space-y-3">
              {categoryStats.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-500">
                      {c.count} order ({c.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* RECENT ORDERS + TOP FREELANCER / REVIEWS */}
      {/* ============================================ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              {role === 'freelancer' ? 'Order Saya' : 'Order Terbaru'}
            </h3>
            <Link
              href={
                role === 'freelancer'
                  ? '/dashboard/my-orders'
                  : '/dashboard/orders'
              }
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>

          {loading && <p className="text-gray-500 text-sm">Memuat...</p>}

          {!loading && recentOrders.length === 0 && (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Belum ada order.</p>
            </div>
          )}

          <div className="space-y-2">
            {recentOrders.map((o) => {
              const style = STATUS_STYLE[o.status] || STATUS_STYLE.open;
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{o.title}</p>
                    <p className="text-xs text-gray-500">
                      {o.category} • {formatRupiah(o.price)}
                    </p>
                  </div>
                  <span className={`badge ${style.bg} text-xs flex-shrink-0`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Freelancer (admin) / Reviews (freelancer) */}
        {role === 'freelancer' ? (
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" />
              Review Terbaru
            </h3>
            {reviews.filter((r) => r.freelancerId === user?.uid).length === 0 ? (
              <div className="text-center py-8">
                <Star size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">
                  Belum ada review. Selesaikan order untuk dapat review!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews
                  .filter((r) => r.freelancerId === user?.uid)
                  .slice(0, 5)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= r.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-600">{r.comment}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-green-600" />
                Top Freelancer
              </h3>
              <Link
                href="/dashboard/freelancers"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Lihat semua <ArrowRight size={12} />
              </Link>
            </div>

            {topFreelancers.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">
                  Belum ada freelancer terdaftar.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topFreelancers.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        idx === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : idx === 1
                          ? 'bg-gray-200 text-gray-700'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {f.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{f.name}</p>
                      <p className="text-xs text-gray-500">
                        {f.completedOrders} order • {formatRupiah(f.earnings)}
                      </p>
                    </div>
                    {f.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 flex-shrink-0">
                        <Star
                          size={12}
                          className="fill-yellow-400 text-yellow-400"
                        />
                        {f.rating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* QUICK ACTIONS */}
      {/* ============================================ */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" /> Aksi Cepat
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {role === 'freelancer' && (
            <>
              <Link
                href="/dashboard/job-board"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Briefcase size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Cari Order</p>
              </Link>
              <Link
                href="/dashboard/my-orders"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <FileText size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Order Saya</p>
              </Link>
              <Link
                href="/dashboard/portfolio"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Users size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Portfolio</p>
              </Link>
              <Link
                href="/dashboard/finance"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Wallet size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Keuangan</p>
              </Link>
            </>
          )}

          {(role === 'admin' || role === 'admin_super') && (
            <>
              <Link
                href="/dashboard/orders"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Plus size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Buat Order</p>
              </Link>
              <Link
                href="/dashboard/freelancers"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Briefcase size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Freelancer</p>
              </Link>
              <Link
                href="/dashboard/audit-logs"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
              >
                <Activity size={20} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium">Audit Log</p>
              </Link>
              {role === 'admin_super' ? (
                <Link
                  href="/dashboard/admins"
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
                >
                  <Users size={20} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-sm font-medium">Manajemen Admin</p>
                </Link>
              ) : (
                <Link
                  href="/dashboard/finance"
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-center"
                >
                  <Wallet size={20} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-sm font-medium">Keuangan</p>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}