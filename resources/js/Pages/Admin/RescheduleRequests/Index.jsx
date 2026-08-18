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

            {/* Header Banner - Solid Clean Light Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600">Manajemen Antrean & Slot</span>
                    <h1 className="text-2xl font-black text-slate-900 mt-1">Review Permintaan Reschedule Pasien (H-1)</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-1">
                        Verifikasi pengajuan perubahan tanggal/shift pasien dan alokasikan slot bed utama tanpa konflik.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-black flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>{stats.pending} Menunggu Review</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div 
                    onClick={() => handleFilterChange('')} 
                    className={`bg-white border p-5 rounded-2xl cursor-pointer transition-all shadow-xs ${filters.status === '' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <p className="text-xs text-slate-500 font-extrabold uppercase">Total Permintaan</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('pending')} 
                    className={`bg-white border p-5 rounded-2xl cursor-pointer transition-all shadow-xs ${filters.status === 'pending' ? 'border-amber-600 ring-2 ring-amber-600/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <p className="text-xs text-amber-700 font-extrabold uppercase">Status Pending</p>
                    <p className="text-2xl font-black text-amber-800 mt-1">{stats.pending}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('approved')} 
                    className={`bg-white border p-5 rounded-2xl cursor-pointer transition-all shadow-xs ${filters.status === 'approved' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <p className="text-xs text-emerald-700 font-extrabold uppercase">Disetujui</p>
                    <p className="text-2xl font-black text-emerald-800 mt-1">{stats.approved}</p>
                </div>
                <div 
                    onClick={() => handleFilterChange('rejected')} 
                    className={`bg-white border p-5 rounded-2xl cursor-pointer transition-all shadow-xs ${filters.status === 'rejected' ? 'border-rose-600 ring-2 ring-rose-600/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <p className="text-xs text-rose-700 font-extrabold uppercase">Ditolak</p>
                    <p className="text-2xl font-black text-rose-800 mt-1">{stats.rejected}</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {rescheduleRequests.data.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-semibold">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-base font-bold text-slate-700">Tidak ada permohonan reschedule ditemukan.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-800">
                            <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Pasien</th>
                                    <th className="py-3.5 px-4">Jadwal Lama</th>
                                    <th className="py-3.5 px-4">Jadwal Baru Diminta</th>
                                    <th className="py-3.5 px-4">Alasan</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {rescheduleRequests.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{req.patient?.user?.name || 'Pasien'}</p>
                                                    <p className="text-xs font-mono font-bold text-blue-700">{req.patient?.medical_record_number || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-xs">
                                            <p className="text-slate-900 font-bold">{req.appointment?.appointment_date ? req.appointment.appointment_date.substring(0, 10) : '-'}</p>
                                            <p className="text-slate-600 mt-0.5 font-bold uppercase">Shift {req.appointment?.shift} ({req.appointment?.bed_number || 'Bed ?'})</p>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-xs">
                                            <p className="text-blue-700 font-black">{req.requested_date ? req.requested_date.substring(0, 10) : '-'}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded font-black uppercase">
                                                Shift {req.requested_shift}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs max-w-xs">
                                            <p className="text-slate-700 font-semibold italic truncate" title={req.reason}>
                                                {req.reason || 'Tidak menyertakan alasan'}
                                            </p>
                                            {req.admin_notes && (
                                                <p className="text-[11px] text-amber-800 font-bold mt-1 truncate" title={req.admin_notes}>
                                                    Catatan Admin: {req.admin_notes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                req.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                'bg-amber-100 text-amber-800 border border-amber-300'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right whitespace-nowrap">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => setSelectedApprove(req)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Setujui</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedReject(req)}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        <span>Tolak</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500 font-bold">Selesai Diproses</span>
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span>Setujui Permintaan Reschedule</span>
                            </h3>
                            <button onClick={() => setSelectedApprove(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-semibold space-y-1">
                                <p>Pasien: <strong className="text-slate-900 font-black">{selectedApprove.patient?.user?.name}</strong></p>
                                <p>Tanggal Diminta: <strong className="text-blue-700 font-black">{selectedApprove.requested_date ? selectedApprove.requested_date.substring(0, 10) : ''}</strong></p>
                                <p>Shift Diminta: <strong className="text-amber-800 font-black uppercase">{selectedApprove.requested_shift}</strong></p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Alokasi Slot Bed Utama (1 - 10)
                                </label>
                                <select
                                    value={approveForm.data.bed_number}
                                    onChange={(e) => approveForm.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>Bed {num}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Catatan Admin (Opsional)
                                </label>
                                <textarea
                                    value={approveForm.data.admin_notes}
                                    onChange={(e) => approveForm.setData('admin_notes', e.target.value)}
                                    placeholder="Tambahkan pesan konfirmasi untuk pasien..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-emerald-600 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedApprove(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={approveForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold rounded-xl shadow-lg transition-all"
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-rose-600 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-600" />
                                <span>Tolak Permintaan Reschedule</span>
                            </h3>
                            <button onClick={() => setSelectedReject(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-semibold">
                                <p>Pasien: <strong className="text-slate-900 font-black">{selectedReject.patient?.user?.name}</strong></p>
                                <p className="mt-1 text-slate-600">Jadwal Lama Tetap Berlaku jika permohonan ditolak.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Alasan Penolakan (Wajib)
                                </label>
                                <textarea
                                    value={rejectForm.data.admin_notes}
                                    onChange={(e) => rejectForm.setData('admin_notes', e.target.value)}
                                    placeholder="Jelaskan alasan penolakan (misal: Kuota bed penuh)..."
                                    rows={3}
                                    required
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-rose-600 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReject(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold rounded-xl shadow-lg transition-all"
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
