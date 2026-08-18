import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Pill, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Filter, 
    User, 
    X,
    Calendar,
    Link2
} from 'lucide-react';

export default function MedicationsIndex({ medications, patients, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [patientId, setPatientId] = useState(filters.patient_id || '');
    const [showModal, setShowModal] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        patient_id: '',
        name: '',
        dosage: '',
        frequency: '',
        notes: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.medications.index'), { search, patient_id: patientId }, { preserveState: true });
    };

    const handlePatientFilter = (val) => {
        setPatientId(val);
        router.get(route('admin.medications.index'), { search, patient_id: val }, { preserveState: true });
    };

    const handleOpenCreateModal = () => {
        setEditingMedication(null);
        reset();
        setShowModal(true);
    };

    const handleOpenEditModal = (med) => {
        setEditingMedication(med);
        setData({
            patient_id: med.patient_id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            notes: med.notes || '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingMedication) {
            put(route('admin.medications.update', editingMedication.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('admin.medications.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (med) => {
        if (confirm(`Apakah Anda yakin ingin menghapus resep obat "${med.name}"?`)) {
            router.delete(route('admin.medications.destroy', med.id));
        }
    };

    return (
        <AdminLayout title="Manajemen Obat Pasien">
            <Head title="Manajemen Obat Pasien — Antrean Hemodialisis" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Manajemen Obat & Dosis Pasien</h2>
                    <p className="text-sm font-semibold text-slate-600">Kelola daftar resep obat rutin pasien hemodialisis (EPO, pengikat fosfat, dll).</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Resep Obat</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
                <form onSubmit={handleSearch} className="flex-1 w-full flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama obat, dosis, atau nama pasien..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300">
                        Cari
                    </button>
                </form>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={patientId}
                        onChange={(e) => handlePatientFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 px-3 py-2 focus:outline-none focus:border-blue-600"
                    >
                        <option value="">Semua Pasien</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>{p.user?.name} ({p.medical_record_number})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-800">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6">Nama Pasien</th>
                                <th className="py-4 px-6">Nama Obat</th>
                                <th className="py-4 px-6">Dosis</th>
                                <th className="py-4 px-6">Frekuensi Aturan</th>
                                <th className="py-4 px-6">Catatan Singkat</th>
                                <th className="py-4 px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {medications.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-500 font-semibold">
                                        Belum ada data resep obat terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                medications.data.map((med) => (
                                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            <div>{med.patient?.user?.name || 'Pasien'}</div>
                                            <div className="text-xs text-blue-700 font-mono font-bold">{med.patient?.medical_record_number}</div>
                                        </td>
                                        <td className="py-4 px-6 font-black text-emerald-700">
                                            {med.name}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                                            {med.dosage}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-semibold text-slate-700">
                                            {med.frequency}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-500 italic font-medium">
                                            {med.notes || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenEditModal(med)}
                                                className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-slate-200"
                                                title="Edit Obat"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(med)}
                                                className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors border border-slate-200"
                                                title="Hapus Obat"
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

                {/* Pagination */}
                {medications.links && medications.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 flex justify-end space-x-1">
                        {medications.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                                    link.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Create / Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Pill className="w-5 h-5 text-emerald-600" />
                                <span>{editingMedication ? 'Edit Resep Obat' : 'Tambah Resep Obat Baru'}</span>
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!editingMedication && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pilih Pasien *</label>
                                    <select
                                        value={data.patient_id}
                                        onChange={(e) => setData('patient_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                                    >
                                        <option value="">-- Pilih Pasien --</option>
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>{p.user?.name} ({p.medical_record_number})</option>
                                        ))}
                                    </select>
                                    {errors.patient_id && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.patient_id}</span>}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Obat *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Erythropoietin (EPO), CaCO3..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                                />
                                {errors.name && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dosis *</label>
                                    <input
                                        type="text"
                                        value={data.dosage}
                                        onChange={(e) => setData('dosage', e.target.value)}
                                        placeholder="4000 IU / 500 mg"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                                    />
                                    {errors.dosage && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.dosage}</span>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Frekuensi *</label>
                                    <input
                                        type="text"
                                        value={data.frequency}
                                        onChange={(e) => setData('frequency', e.target.value)}
                                        placeholder="2x seminggu / 3x sehari"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                                    />
                                    {errors.frequency && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.frequency}</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan / Instruksi Khusus</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows="3"
                                    placeholder="Disuntikkan secara subkutan pasca HD..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                                ></textarea>
                                {errors.notes && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.notes}</span>}
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
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Obat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
