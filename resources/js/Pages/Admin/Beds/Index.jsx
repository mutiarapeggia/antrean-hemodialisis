import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Bed, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Wrench, XCircle, X } from 'lucide-react';

export default function Index({ beds = [] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingBed, setEditingBed] = useState(null);
    const [deletingBed, setDeletingBed] = useState(null);

    const form = useForm({
        bed_number: '',
        label: '',
        status: 'available',
        notes: '',
    });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        form.post(route('admin.beds.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                form.reset();
            },
        });
    };

    const openEditModal = (bed) => {
        setEditingBed(bed);
        form.setData({
            bed_number: bed.bed_number,
            label: bed.label,
            status: bed.status,
            notes: bed.notes || '',
        });
        form.clearErrors();
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        form.put(route('admin.beds.update', editingBed.id), {
            onSuccess: () => {
                setEditingBed(null);
                form.reset();
            },
        });
    };

    const handleDeleteSubmit = (e) => {
        e.preventDefault();
        form.delete(route('admin.beds.destroy', deletingBed.id), {
            onSuccess: () => {
                setDeletingBed(null);
            },
        });
    };

    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const maintenanceBeds = beds.filter(b => b.status === 'maintenance' || b.status === 'damaged').length;

    return (
        <AdminLayout title="Master Bed Dinamis">
            <Head title="Master Bed — Admin Klinik" />

            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600">Manajemen Fasilitas</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Master Bed & Status Alat</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-1">
                        Kelola ketersediaan tempat tidur hemodialisis, status pemeliharaan, dan alat secara *realtime*.
                    </p>
                </div>

                <button
                    onClick={() => {
                        form.reset();
                        form.setData({ bed_number: `Bed ${beds.length + 1}`, label: `Bed Utama ${beds.length + 1}`, status: 'available', notes: '' });
                        setIsAddOpen(true);
                    }}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Bed Baru</span>
                </button>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block uppercase">Total Bed Klinik</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">{totalBeds}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold text-emerald-800 block uppercase">Siap Pakai (Available)</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">{availableBeds}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold text-blue-800 block uppercase">Terpakai (Occupied)</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 mt-1 block">{occupiedBeds}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold text-amber-800 block uppercase">Maintenance / Rusak</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-700 mt-1 block">{maintenanceBeds}</span>
                </div>
            </div>

            {/* Beds Table / Cards */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center space-x-2">
                    <Bed className="w-5 h-5 text-blue-600" />
                    <span>Daftar Seluruh Tempat Tidur Hemodialisis</span>
                </h2>

                {beds.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-semibold text-sm">
                        Belum ada data Master Bed. Klik tombol "Tambah Bed Baru" di atas.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase text-[11px] font-black tracking-wider">
                                    <th className="py-3 px-4">Kode / Nomor Bed</th>
                                    <th className="py-3 px-4">Label / Nama Bed</th>
                                    <th className="py-3 px-4">Status Pengoperasian</th>
                                    <th className="py-3 px-4">Catatan Maintenance</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {beds.map((bed) => (
                                    <tr key={bed.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-4 font-mono font-black text-slate-900 text-base">
                                            {bed.bed_number}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-800">
                                            {bed.label}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                                                bed.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                bed.status === 'occupied' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                                bed.status === 'maintenance' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                'bg-rose-100 text-rose-800 border border-rose-300'
                                            }`}>
                                                {bed.status === 'available' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                {bed.status === 'occupied' && <Bed className="w-3.5 h-3.5" />}
                                                {bed.status === 'maintenance' && <Wrench className="w-3.5 h-3.5" />}
                                                {bed.status === 'damaged' && <AlertTriangle className="w-3.5 h-3.5" />}
                                                <span>
                                                    {bed.status === 'available' ? 'Siap Pakai' :
                                                     bed.status === 'occupied' ? 'Terpakai' :
                                                     bed.status === 'maintenance' ? 'Perbaikan / Maintenance' : 'Rusak'}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs font-medium text-slate-600">
                                            {bed.notes ? (
                                                <span className="italic text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                                                    {bed.notes}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(bed)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-bold text-xs inline-flex items-center space-x-1"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => setDeletingBed(bed)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs inline-flex items-center space-x-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Hapus</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL TAMBAH MASTER BED */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                <span>Tambah Master Bed Baru</span>
                            </h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kode / Nomor Bed</label>
                                <input
                                    type="text"
                                    value={form.data.bed_number}
                                    onChange={(e) => form.setData('bed_number', e.target.value)}
                                    placeholder="Contoh: Bed 1 atau Bed 11"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {form.errors.bed_number && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.bed_number}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama / Label Keterangan Bed</label>
                                <input
                                    type="text"
                                    value={form.data.label}
                                    onChange={(e) => form.setData('label', e.target.value)}
                                    placeholder="Contoh: Bed Utama 1"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {form.errors.label && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.label}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status Pengoperasian Bed</label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                >
                                    <option value="available">Siap Pakai (Available)</option>
                                    <option value="occupied">Sedang Terpakai (Occupied)</option>
                                    <option value="maintenance">Dalam Pemeliharaan / Perbaikan (Maintenance)</option>
                                    <option value="damaged">Rusak (Damaged)</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.status}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Pemeliharaan (Opsional)</label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Isi catatan maintenance jika ada..."
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-blue-600/30"
                                >
                                    Simpan Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIT MASTER BED */}
            {editingBed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Edit2 className="w-5 h-5 text-blue-600" />
                                <span>Edit Data Bed ({editingBed.bed_number})</span>
                            </h3>
                            <button onClick={() => setEditingBed(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kode / Nomor Bed</label>
                                <input
                                    type="text"
                                    value={form.data.bed_number}
                                    onChange={(e) => form.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {form.errors.bed_number && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.bed_number}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama / Label Keterangan Bed</label>
                                <input
                                    type="text"
                                    value={form.data.label}
                                    onChange={(e) => form.setData('label', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {form.errors.label && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.label}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status Pengoperasian Bed</label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                >
                                    <option value="available">Siap Pakai (Available)</option>
                                    <option value="occupied">Sedang Terpakai (Occupied)</option>
                                    <option value="maintenance">Dalam Pemeliharaan / Perbaikan (Maintenance)</option>
                                    <option value="damaged">Rusak (Damaged)</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-bold text-rose-600 mt-1">{form.errors.status}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Pemeliharaan (Opsional)</label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Isi catatan maintenance jika ada..."
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingBed(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-blue-600/30"
                                >
                                    Perbarui Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HAPUS BED */}
            {deletingBed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-rose-600 flex items-center space-x-2">
                                <XCircle className="w-5 h-5" />
                                <span>Hapus Master Bed</span>
                            </h3>
                            <button onClick={() => setDeletingBed(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDeleteSubmit} className="space-y-4">
                            <p className="text-sm font-semibold text-slate-700">
                                Apakah Anda yakin ingin menghapus <strong className="text-slate-900 font-black">{deletingBed.bed_number} ({deletingBed.label})</strong> dari Master Bed?
                            </p>

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setDeletingBed(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-rose-600/30"
                                >
                                    Konfirmasi Hapus
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
