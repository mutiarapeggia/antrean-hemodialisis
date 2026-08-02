import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Calendar, 
    Bed, 
    User, 
    FileText, 
    Check, 
    X, 
    AlertTriangle,
    Search
} from 'lucide-react';

export default function Index({ rescheduleRequests, stats, filters }) {
    const [selectedApprove, setSelectedApprove] = useState(null);
    const [selectedReject, setSelectedReject] = useState(null);

    const approveForm = useForm({
        bed_number: '1',
        admin_notes: '',
    });

    const rejectForm = useForm({
        admin_notes: '',
    });

    const handleFilterChange = (status) => {
        router.get(route('admin.reschedule-requests.index'), { status }, { preserveState: true });
    };

    const handleApproveSubmit = (e) => {
        e.preventDefault();
        approveForm.post(route('admin.reschedule-requests.approve', selectedApprove.id), {
            onSuccess: () => {
                setSelectedApprove(null);
                approveForm.reset();
            },
        });
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        rejectForm.post(route('admin.reschedule-requests.reject', selectedReject.id), {
            onSuccess: () => {
                setSelectedReject(null);
                rejectForm.reset();
            },
        });
    };

    return (
        <AdminLayout title="Review Permintaan Reschedule">
            <Head title="Permintaan Reschedule - Admin" />

            {/* Header Banner - Solid Clean Dark Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Manajemen Antrean & Slot</span>
                    <h1 className="text-2xl font-extrabold text-white mt-1">Review Permintaan Reschedule Pasien (H-1)</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Verifikasi pengajuan perubahan tanggal/shift pasien dan alokasikan slot bed utama tanpa konflik.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{stats.pending} Menunggu Review</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div 
                    onClick={() => handleFilterChange('')} 
                    className={`bg-slate-900 border p-5 rounded-2xl cursor-pointer transition-all ${filters.status === '' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                    <p className="text-xs text-slate-400 font-medium">Total Permintaan</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('pending')} 
                    className={`bg-slate-900 border p-5 rounded-2xl cursor-pointer transition-all ${filters.status === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                    <p className="text-xs text-slate-400 font-medium">Status Pending</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('approved')} 
                    className={`bg-slate-900 border p-5 rounded-2xl cursor-pointer transition-all ${filters.status === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                    <p className="text-xs text-slate-400 font-medium">Disetujui</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('rejected')} 
                    className={`bg-slate-900 border p-5 rounded-2xl cursor-pointer transition-all ${filters.status === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                    <p className="text-xs text-slate-400 font-medium">Ditolak</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{stats.rejected}</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {rescheduleRequests.data.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-base font-medium">Tidak ada permohonan reschedule ditemukan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4">Pasien</th>
                                    <th className="py-3.5 px-4">Jadwal Lama</th>
                                    <th className="py-3.5 px-4">Jadwal Baru Diminta</th>
                                    <th className="py-3.5 px-4">Alasan</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {rescheduleRequests.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                                                    <User className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{req.patient?.user?.name || 'Pasien'}</p>
                                                    <p className="text-xs font-mono text-blue-400">{req.patient?.medical_record_number || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-xs">
                                            <p className="text-slate-200 font-semibold">{req.appointment?.appointment_date ? req.appointment.appointment_date.substring(0, 10) : '-'}</p>
                                            <p className="text-slate-400 mt-0.5 uppercase">Shift {req.appointment?.shift} ({req.appointment?.bed_number || 'Bed ?'})</p>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-xs">
                                            <p className="text-cyan-300 font-bold">{req.requested_date ? req.requested_date.substring(0, 10) : '-'}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-bold uppercase">
                                                Shift {req.requested_shift}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs max-w-xs">
                                            <p className="text-slate-300 italic truncate" title={req.reason}>
                                                {req.reason || 'Tidak menyertakan alasan'}
                                            </p>
                                            {req.admin_notes && (
                                                <p className="text-[11px] text-amber-400 mt-1 truncate" title={req.admin_notes}>
                                                    Catatan Admin: {req.admin_notes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right whitespace-nowrap">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => setSelectedApprove(req)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Setujui</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedReject(req)}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        <span>Tolak</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500 font-medium">Selesai Diproses</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL APPROVE: PILIH BED */}
            {selectedApprove && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span>Setujui Permintaan Reschedule</span>
                            </h3>
                            <button onClick={() => setSelectedApprove(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                                <p>Pasien: <strong className="text-white">{selectedApprove.patient?.user?.name}</strong></p>
                                <p>Tanggal Diminta: <strong className="text-cyan-300">{selectedApprove.requested_date ? selectedApprove.requested_date.substring(0, 10) : ''}</strong></p>
                                <p>Shift Diminta: <strong className="text-amber-400 uppercase">{selectedApprove.requested_shift}</strong></p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                    Alokasi Slot Bed Utama (1 - 10)
                                </label>
                                <select
                                    value={approveForm.data.bed_number}
                                    onChange={(e) => approveForm.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>Bed {num}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                    Catatan Admin (Opsional)
                                </label>
                                <textarea
                                    value={approveForm.data.admin_notes}
                                    onChange={(e) => approveForm.setData('admin_notes', e.target.value)}
                                    placeholder="Tambahkan pesan konfirmasi untuk pasien..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedApprove(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={approveForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
                                >
                                    Setujui & Alokasikan Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REJECT: ISI ALASAN */}
            {selectedReject && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-400" />
                                <span>Tolak Permintaan Reschedule</span>
                            </h3>
                            <button onClick={() => setSelectedReject(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                                <p>Pasien: <strong className="text-white">{selectedReject.patient?.user?.name}</strong></p>
                                <p className="mt-1 text-slate-400">Jadwal Lama Tetap Berlaku jika permohonan ditolak.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                    Alasan Penolakan (Wajib)
                                </label>
                                <textarea
                                    value={rejectForm.data.admin_notes}
                                    onChange={(e) => rejectForm.setData('admin_notes', e.target.value)}
                                    placeholder="Jelaskan alasan penolakan (misal: Kuota bed penuh)..."
                                    rows={3}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-rose-500 focus:outline-none"
                                />
                                {rejectForm.errors.admin_notes && (
                                    <p className="text-xs text-rose-400 mt-1">{rejectForm.errors.admin_notes}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReject(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
                                >
                                    Konfirmasi Penolakan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
