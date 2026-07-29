import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Users, 
    UserPlus, 
    Search, 
    Filter, 
    FileUp, 
    FileDown, 
    Eye, 
    Edit, 
    Power,
    X,
    Upload
} from 'lucide-react';

export default function Index({ patients, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showImportModal, setShowImportModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        csv_file: null,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.patients.index'), { search, status }, { preserveState: true });
    };

    const handleStatusFilter = (val) => {
        setStatus(val);
        router.get(route('admin.patients.index'), { search, status: val }, { preserveState: true });
    };

    const handleToggleStatus = (id) => {
        if (confirm('Apakah Anda yakin ingin mengubah status aktif pasien ini?')) {
            router.post(route('admin.patients.toggle-status', id));
        }
    };

    const handleImportCsv = (e) => {
        e.preventDefault();
        post(route('admin.patients.import'), {
            onSuccess: () => {
                setShowImportModal(false);
                reset();
            },
        });
    };

    return (
        <AdminLayout title="Manajemen Pasien">
            <Head title="Manajemen Pasien" />

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Daftar Pasien Hemodialisis</h2>
                    <p className="text-sm text-slate-400">Kelola data profil, kontak, dan status aktif pasien.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
                    >
                        <FileUp className="w-4 h-4 text-emerald-400" />
                        <span>Impor CSV</span>
                    </button>
                    <a
                        href={route('admin.patients.export')}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
                    >
                        <FileDown className="w-4 h-4 text-blue-400" />
                        <span>Ekspor CSV</span>
                    </a>
                    <Link
                        href={route('admin.patients.create')}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Pasien</span>
                    </Link>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="flex-1 w-full flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama, No RM, atau telepon..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
                    >
                        Cari
                    </button>
                </form>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={status}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 px-4 py-2.5 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="py-4 px-6">No RM</th>
                                <th className="py-4 px-6">Nama Pasien</th>
                                <th className="py-4 px-6">Kontak</th>
                                <th className="py-4 px-6">Kondisi Medis</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {patients.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-500">
                                        Tidak ada data pasien yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                patients.data.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs font-semibold text-blue-400">
                                            {patient.medical_record_number}
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-100">
                                            <div>{patient.user?.name || 'Tanpa Akun User'}</div>
                                            <div className="text-xs text-slate-400 font-normal">{patient.user?.email || '-'}</div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-300">
                                            {patient.phone}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-400 max-w-xs truncate">
                                            {patient.medical_conditions || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                patient.is_active 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                                {patient.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <Link
                                                href={route('admin.patients.show', patient.id)}
                                                className="inline-flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={route('admin.patients.edit', patient.id)}
                                                className="inline-flex p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                title="Edit Data"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleToggleStatus(patient.id)}
                                                className={`inline-flex p-2 rounded-lg transition-colors ${
                                                    patient.is_active 
                                                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' 
                                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                                }`}
                                                title={patient.is_active ? 'Nonaktifkan Pasien' : 'Aktifkan Pasien'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {patients.links.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex space-x-1">
                            {patients.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                        link.active 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Import CSV Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                                <Upload className="w-5 h-5 text-emerald-400" />
                                <span>Impor Data Pasien (CSV)</span>
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImportCsv} className="space-y-4">
                            <p className="text-xs text-slate-400">
                                Upload file CSV dengan format kolom: <br />
                                <code className="text-blue-400 font-mono">No RM, Nama, Email, No Telepon, Alamat, Kondisi Medis</code>
                            </p>

                            <div>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) => setData('csv_file', e.target.files[0])}
                                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                                />
                                {errors.csv_file && <span className="text-xs text-rose-400 mt-1 block">{errors.csv_file}</span>}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                                >
                                    {processing ? 'Mengimpor...' : 'Mulai Impor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
