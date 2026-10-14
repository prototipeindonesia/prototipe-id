'use client';
import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function CloudinaryUpload({ orderId, label = 'Upload File' }) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'orders', orderId), {
        files: arrayUnion({
          url: res.secure_url,
          publicId: res.public_id,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        }),
      });
      setFiles((prev) => [...prev, res.secure_url]);
      toast.success('File berhasil diunggah!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="btn btn-outline cursor-pointer">
        <Upload size={16} />
        {loading ? 'Mengunggah...' : label}
        <input type="file" className="hidden" onChange={handleUpload} />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 text-sm text-gray-600 space-y-1">
          {files.map((url, i) => (
            <li key={i}>
              <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                Lihat file {i + 1}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
