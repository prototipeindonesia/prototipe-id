'use client';
import { useState, useRef } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addPortfolioItem } from '@/lib/portfolio';
import toast from 'react-hot-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'UI/UX',
  'Developer',
  'Desain Grafis',
  'Produk Digital',
  'Lainnya',
];

export default function PortfolioUpload({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI/UX');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validasi tipe
    if (!f.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.');
      return;
    }

    // Validasi ukuran (max 5MB)
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB.');
      return;
    }

    setFile(f);

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Pilih gambar dulu.');
      return;
    }

    if (!title.trim()) {
      toast.error('Judul karya wajib diisi.');
      return;
    }

    setUploading(true);
    try {
      // Upload ke Cloudinary
      const result = await uploadToCloudinary(file);

      // Simpan ke Firestore
      await addPortfolioItem({
        title: title.trim(),
        description: description.trim(),
        imageUrl: result.secure_url,
        category,
      });

      toast.success('Karya berhasil ditambahkan! 🎉');

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('UI/UX');
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold">Tambah Karya Baru</h3>

      {/* Upload Area */}
      <div>
        <label className="text-sm font-medium mb-1 block">Gambar Karya</label>

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <ImageIcon size={40} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              Tap untuk pilih gambar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, atau WEBP • Max 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Judul */}
      <div>
        <label className="text-sm font-medium mb-1 block">
          Judul Karya <span className="text-red-500">*</span>
        </label>
        <input
          placeholder="Contoh: Desain Logo Kafe Kopi Senja"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      {/* Kategori */}
      <div>
        <label className="text-sm font-medium mb-1 block">Kategori</label>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Deskripsi */}
      <div>
        <label className="text-sm font-medium mb-1 block">
          Deskripsi (opsional)
        </label>
        <textarea
          rows={3}
          placeholder="Ceritakan tentang karya ini..."
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">
          {description.length}/500 karakter
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading || !file}
        className="btn btn-primary w-full justify-center disabled:opacity-50"
      >
        <Upload size={16} />
        {uploading ? 'Mengunggah...' : 'Simpan Karya'}
      </button>
    </form>
  );
}