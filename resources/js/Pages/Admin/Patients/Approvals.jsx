import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { UserCheck, UserX, Clock, AlertTriangle, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

export default function PatientApprovalsIndex({ patients, stats, filters }) {
    const [status, setStatus] = useState(filters.status || 'pending');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const { data: rejectData, setData: setRejectData, post: postReject, processing: processingReject, reset: resetReject } = useForm({
        rejection_reason: '',
    });

    const handleFilterStatus = (newStatus) => {
        setStatus(newStatus);
        router.get(route('admin.patient-approvals.index'), { status: newStatus }, { preserveState: true });
    };

    const handleApprove = (patient) => {
        if (confirm(`Setujui pendaftaran pasien ${patient.user?.name}?`)) {
            router.post(route('admin.patient-approvals.approve', patient.id));
        }
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!selectedPatient) return;
        postReject(route('admin.patient-approvals.reject', selectedPatient.id), {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedPatient(null);
                resetReject();
            }
        });
    };

    return (
        <AdminLayout title="Workflow Approval Pendaftaran Pasien Baru">
            <Head title="Approval Pasien Baru — Antrean Hemodialisis" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Workflow Approval Pendaftaran Pasien (T-602)</h2>
                    <p className="text-sm text-slate-500">Verifikasi dan setujui pendaftaran mandiri pasien baru sebelum membuat janji temu.</p>
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                    onClick={() => handleFilterStatus('pending')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        status === 'pending'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-amber-700">Menunggu Verifikasi</span>
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-2 block">{stats.pending} Pasien</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('approved')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        status === 'approved'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-emerald-700">Disetujui (Aktif)</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-2 block">{stats.approved} Pasien</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('rejected')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                        status === 'rejected'
                            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-rose-700">Ditolak</span>
                        <XCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-2 block">{stats.rejected} Pasien</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6">Nama & No. RM</th>
                                <th className="py-4 px-6">Email & No. HP</th>
                                <th className="py-4 px-6">Kondisi Medis</th>
                                <th className="py-4 px-6">Status Approval</th>
                                <th className="py-4 px-6 text-right">Aksi Staf</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {patients.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-400">
                                        Tidak ada pendaftaran pasien dengan status ini.
                                    </td>
                                </tr>
                            ) : (
                                patients.data.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            <div>{patient.user?.name}</div>
                                            <div className="text-xs text-blue-700 font-mono">{patient.medical_record_number}</div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-600">
                                            <div>{patient.user?.email}</div>
                                            <div className="text-slate-500 font-mono">{patient.phone || '-'}</div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-700 max-w-xs">
                                            {patient.medical_conditions || 'GGK Stage 5'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                patient.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                patient.approval_status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                {patient.approval_status === 'approved' ? 'Disetujui' :
                                                 patient.approval_status === 'rejected' ? 'Ditolak' :
                                                 'Pending Review'}
                                            </span>
                                            {patient.rejection_reason && (
                                                <div className="text-xs text-rose-600 italic mt-1 max-w-xs">
                                                    Alasan: {patient.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            {patient.approval_status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(patient)}
                                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        <span>Setujui</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setShowRejectModal(true);
                                                        }}
                                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                                    >
                                                        <UserX className="w-3.5 h-3.5" />
                                                        <span>Tolak</span>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {patients.links && patients.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 flex justify-end space-x-1">
                        {patients.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                    link.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Reject Registration */}
            {showRejectModal && selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-rose-600 mb-2 flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Tolak Pendaftaran Pasien</span>
                        </h3>
                        <p className="text-xs text-slate-600 mb-4">
                            Masukkan alasan penolakan pendaftaran untuk pasien <strong className="text-slate-900">{selectedPatient.user?.name}</strong>.
                        </p>
                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alasan Penolakan *</label>
                                <textarea
                                    value={rejectData.rejection_reason}
                                    onChange={(e) => setRejectData('rejection_reason', e.target.value)}
                                    placeholder="Contoh: Berkas rekam medis tidak sesuai, atau pasien belum terverifikasi..."
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingReject}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20"
                                >
                                    {processingReject ? 'Memproses...' : 'Tolak Pendaftaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
