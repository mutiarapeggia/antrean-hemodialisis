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
                    <h2 className="text-xl font-bold text-slate-100">Pengumuman Klinik & Informasi Pasien (FR-41)</h2>
                    <p className="text-sm text-slate-400">Buat, edit, dan publikasikan informasi operasional klinik untuk antarmuka pasien.</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pengumuman Baru</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan judul atau konten pengumuman..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl">
                        Cari
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="py-4 px-6">Tanggal Terbit</th>
                                <th className="py-4 px-6">Judul Pengumuman</th>
                                <th className="py-4 px-6">Konten</th>
                                <th className="py-4 px-6">Penulis</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {announcements.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-500">
                                        Belum ada pengumuman terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                announcements.data.map((ann) => (
                                    <tr key={ann.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs text-blue-400 font-semibold">
                                            {ann.publish_date}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-100 max-w-xs">
                                            {ann.title}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-400 max-w-md truncate">
                                            {ann.content}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-300">
                                            {ann.admin?.name || 'Admin'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                ann.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                                {ann.is_active ? 'Aktif (Tampil)' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleToggleStatus(ann)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    ann.is_active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                }`}
                                                title={ann.is_active ? 'Sembunyikan' : 'Tampilkan'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(ann)}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ann)}
                                                className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
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
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                                <Bell className="w-5 h-5 text-blue-400" />
                                <span>{editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</span>
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Judul Pengumuman *</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Judul pengumuman singkat..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                                {errors.title && <span className="text-xs text-rose-400 mt-1 block">{errors.title}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tanggal Publikasi *</label>
                                <input
                                    type="date"
                                    value={data.publish_date}
                                    onChange={(e) => setData('publish_date', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                                {errors.publish_date && <span className="text-xs text-rose-400 mt-1 block">{errors.publish_date}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Isi Konten Pengumuman *</label>
                                <textarea
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    rows="4"
                                    placeholder="Detail pesan pengumuman untuk pasien..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                ></textarea>
                                {errors.content && <span className="text-xs text-rose-400 mt-1 block">{errors.content}</span>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-xs font-medium text-slate-300">Publikasikan dan Tampilkan Langsung ke Portal Pasien</label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30"
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
