import Link from 'next/link';
import { ArrowRight, Palette, Code, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function Home() {
  const services = [
    { icon: Palette, title: 'UI/UX Design', desc: 'Desain aplikasi & website modern' },
    { icon: Code, title: 'Web & App Developer', desc: 'Pembuatan aplikasi custom' },
    { icon: Sparkles, title: 'Desain Grafis', desc: 'PPT, Flyer, Poster, Majalah' },
    { icon: FileSpreadsheet, title: 'Produk Digital', desc: 'Template, Matriks Excel, Landing Page' },
  ];

  return (
    <main className="min-h-screen">
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg" />
            <span className="font-bold text-lg">Prototipe.id</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="btn btn-outline">Masuk</Link>
            <Link href="/register" className="btn btn-primary">Daftar</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <span className="badge bg-blue-100 text-blue-600 mb-4">
          🚀 Platform Freelance Digital #1
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Wujudkan Ide Digitalmu<br />
          Bersama <span className="text-blue-600">Prototipe.id</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Platform yang menghubungkan klien dengan freelancer profesional.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn btn-primary">
            Mulai Sekarang <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Layanan Kami</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <div key={i} className="card hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <s.icon className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t mt-20 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Prototipe.id
      </footer>
    </main>
  );
}
