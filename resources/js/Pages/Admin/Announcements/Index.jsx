import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Bell, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Power, 
    Calendar,
    X,
    CheckCircle2
} from 'lucide-react';

export default function AnnouncementsIndex({ announcements, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        title: '',
        content: '',
        publish_date: new Date().toISOString().split('T')[0],
        is_active: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.announcements.index'), { search }, { preserveState: true });
    };

    const handleOpenCreateModal = () => {
        setEditingAnnouncement(null);
        reset();
        setShowModal(true);
    };

    const handleOpenEditModal = (ann) => {
        setEditingAnnouncement(ann);
        setData({
            title: ann.title,
            content: ann.content,
            publish_date: ann.publish_date,
            is_active: ann.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAnnouncement) {
            put(route('admin.announcements.update', editingAnnouncement.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.announcements.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleToggleStatus = (ann) => {
        router.post(route('admin.announcements.toggle-status', ann.id));
    };

    const handleDelete = (ann) => {
        if (confirm(`Apakah Anda yakin ingin menghapus pengumuman "${ann.title}"?`)) {
            router.delete(route('admin.announcements.destroy', ann.id));
        }
    };

    return (
        <AdminLayout title="Manajemen Pengumuman Klinik">
            <Head title="Pengumuman Klinik — Antrean Hemodialisis" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Pengumuman Klinik & Informasi Pasien</h2>
                    <p className="text-sm font-semibold text-slate-600">Buat, edit, dan publikasikan informasi operasional klinik untuk antarmuka pasien.</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pengumuman Baru</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan judul atau konten pengumuman..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300">
                        Cari
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-800">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6">Tanggal Terbit</th>
                                <th className="py-4 px-6">Judul Pengumuman</th>
                                <th className="py-4 px-6">Konten</th>
                                <th className="py-4 px-6">Penulis</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {announcements.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-500 font-semibold">
                                        Belum ada pengumuman terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                announcements.data.map((ann) => (
                                    <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs text-blue-700 font-black">
                                            {ann.publish_date}
                                        </td>
                                        <td className="py-4 px-6 font-black text-slate-900 max-w-xs">
                                            {ann.title}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-semibold text-slate-600 max-w-md truncate">
                                            {ann.content}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-700">
                                            {ann.admin?.name || 'Admin'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                                ann.is_active
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                            }`}>
                                                {ann.is_active ? 'Aktif (Tampil)' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleToggleStatus(ann)}
                                                className={`p-2 rounded-lg transition-colors border border-slate-200 ${
                                                    ann.is_active ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                }`}
                                                title={ann.is_active ? 'Sembunyikan' : 'Tampilkan'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(ann)}
                                                className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-slate-200"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ann)}
                                                className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors border border-slate-200"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create / Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                                <span>{editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</span>
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Judul Pengumuman *</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Judul pengumuman singkat..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                                />
                                {errors.title && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.title}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Publikasi *</label>
                                <input
                                    type="date"
                                    value={data.publish_date}
                                    onChange={(e) => setData('publish_date', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                                />
                                {errors.publish_date && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.publish_date}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Isi Konten Pengumuman *</label>
                                <textarea
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    rows="4"
                                    placeholder="Detail pesan pengumuman untuk pasien..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                                ></textarea>
                                {errors.content && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.content}</span>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-xs font-bold text-slate-700">Publikasikan dan Tampilkan Langsung ke Portal Pasien</label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/30"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Pengumuman'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
