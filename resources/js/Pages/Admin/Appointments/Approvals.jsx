import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckSquare, XSquare, AlertOctagon, Calendar, Clock, User, ShieldAlert, Plus, X, Filter, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function AppointmentApprovalsIndex({ appointments, rescheduleRequests, patients, stats, filters }) {
    const [activeTab, setActiveTab] = useState(filters?.type === 'reschedule' ? 'reschedule' : 'new');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null); // 'approve_new', 'reject_new', 'approve_reschedule', 'reject_reschedule'
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    // Form for Approving New Appointment
    const { data: approveData, setData: setApproveData, post: postApprove, processing: processingApprove, reset: resetApprove } = useForm({
        bed_number: '1',
        emergency_override: false,
        admin_notes: '',
    });

    // Form for Rejecting (Synchronized for both appointment reject & reschedule reject)
    const { data: rejectData, setData: setRejectData, post: postReject, processing: processingReject, reset: resetReject, errors: rejectErrors } = useForm({
        reason: '',
        admin_notes: '',
        rejection_reason: '',
    });

    // Form for Emergency Override Creation
    const { data: emergencyData, setData: setEmergencyData, post: postEmergency, processing: processingEmergency, reset: resetEmergency } = useForm({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        shift: 'pagi',
        bed_number: 1,
        emergency_reason: '',
    });

    const handleOpenApproveModal = (item, type) => {
        setSelectedItem(item);
        setModalType(type);
        setApproveData({
            bed_number: item.bed_number || '1',
            emergency_override: false,
            admin_notes: '',
        });
    };

    const handleOpenRejectModal = (item, type) => {
        setSelectedItem(item);
        setModalType(type);
        setRejectData({
            reason: '',
            admin_notes: '',
            rejection_reason: '',
        });
    };

    const handleConfirmApprove = (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (modalType === 'approve_new') {
            postApprove(route('admin.appointment-approvals.approve', selectedItem.id), {
                onSuccess: () => {
                    setModalType(null);
                    setSelectedItem(null);
                    resetApprove();
                }
            });
        } else if (modalType === 'approve_reschedule') {
            postApprove(route('admin.reschedule-requests.approve', selectedItem.id), {
                onSuccess: () => {
                    setModalType(null);
                    setSelectedItem(null);
                    resetApprove();
                }
            });
        }
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (modalType === 'reject_new') {
            postReject(route('admin.appointment-approvals.reject', selectedItem.id), {
                onSuccess: () => {
                    setModalType(null);
                    setSelectedItem(null);
                    resetReject();
                }
            });
        } else if (modalType === 'reject_reschedule') {
            postReject(route('admin.reschedule-requests.reject', selectedItem.id), {
                onSuccess: () => {
                    setModalType(null);
                    setSelectedItem(null);
                    resetReject();
                }
            });
        }
    };

    const handleEmergencySubmit = (e) => {
        e.preventDefault();
        postEmergency(route('admin.appointment-approvals.emergency-override'), {
            onSuccess: () => {
                setShowEmergencyModal(false);
                resetEmergency();
            }
        });
    };

    const handleStatusFilter = (newStatus) => {
        router.get(route('admin.appointment-approvals.index'), { type: activeTab, status: newStatus }, { preserveState: true });
    };

    return (
        <AdminLayout title="Consolidated Approval Janji Temu & Reschedule">
            <Head title="Consolidated Approval — Antrean Hemodialisis" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Konsol Approval Janji Temu & Reschedule</h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">Verifikasi permohonan booking baru, alokasi bed, permohonan reschedule (H-1), dan override darurat.</p>
                </div>

                <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 min-h-[48px]"
                >
                    <ShieldAlert className="w-5 h-5" />
                    <span>Emergency Override Manual</span>
                </button>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => handleStatusFilter('pending')}
                    className={`p-4 rounded-2xl border text-left transition-all min-h-[80px] ${
                        (filters?.status === 'pending' || !filters?.status)
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-amber-800">Menunggu Approval</span>
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.total_pending || 0} Pengajuan</span>
                </button>

                <button
                    onClick={() => { setActiveTab('new'); handleStatusFilter('pending'); }}
                    className={`p-4 rounded-2xl border text-left transition-all min-h-[80px] ${
                        activeTab === 'new'
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-blue-800">Booking Janji Baru</span>
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.new_pending || 0} Booking</span>
                </button>

                <button
                    onClick={() => { setActiveTab('reschedule'); handleStatusFilter('pending'); }}
                    className={`p-4 rounded-2xl border text-left transition-all min-h-[80px] ${
                        activeTab === 'reschedule'
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-purple-800">Permintaan Reschedule</span>
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.reschedule_pending || 0} Requests</span>
                </button>

                <button
                    onClick={() => handleStatusFilter('approved')}
                    className={`p-4 rounded-2xl border text-left transition-all min-h-[80px] ${
                        filters?.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-emerald-800">Telah Disetujui</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.approved_count || 0} Janji</span>
                </button>
            </div>

            {/* Tab Navigation & Status Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 bg-white border border-slate-200 p-3 rounded-2xl">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                            activeTab === 'new'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Janji Temu Baru ({stats?.new_pending || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('reschedule')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                            activeTab === 'reschedule'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Permintaan Reschedule ({stats?.reschedule_pending || 0})
                    </button>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            (filters?.status === 'pending' || !filters?.status) ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => handleStatusFilter('approved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            filters?.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        Disetujui
                    </button>
                    <button
                        onClick={() => handleStatusFilter('rejected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            filters?.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        Ditolak
                    </button>
                </div>
            </div>

            {/* TAB CONTENT 1: Janji Temu Baru */}
            {activeTab === 'new' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-base">Permintaan Janji Temu Baru Pasien</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-black border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6">Pasien & No. RM</th>
                                    <th className="py-4 px-6">Tanggal & Shift</th>
                                    <th className="py-4 px-6">Usulan Bed</th>
                                    <th className="py-4 px-6">Status Approval</th>
                                    <th className="py-4 px-6 text-right">Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {(!appointments?.data || appointments.data.length === 0) ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-500 font-semibold">
                                            Tidak ada permintaan janji temu baru dengan status ini.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900">
                                                <div>{app.patient?.user?.name}</div>
                                                <div className="text-xs text-blue-700 font-mono">{app.patient?.medical_record_number}</div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-800">
                                                <div className="font-extrabold">{app.appointment_date}</div>
                                                <div className="text-slate-600 font-semibold capitalize">Shift {app.shift}</div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-slate-900 font-extrabold">
                                                Bed #{app.bed_number || 'Belum Diisi'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                                    app.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    app.approval_status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                    'bg-amber-100 text-amber-800 border border-amber-300'
                                                }`}>
                                                    {app.approval_status === 'approved' ? 'Disetujui' :
                                                     app.approval_status === 'rejected' ? 'Ditolak' :
                                                     'Pending Review'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                {app.approval_status === 'pending_approval' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenApproveModal(app, 'approve_new')}
                                                            className="inline-flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[38px]"
                                                        >
                                                            <CheckSquare className="w-4 h-4" />
                                                            <span>Setujui & Bed</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenRejectModal(app, 'reject_new')}
                                                            className="inline-flex items-center space-x-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[38px]"
                                                        >
                                                            <XSquare className="w-4 h-4" />
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
                </div>
            )}

            {/* TAB CONTENT 2: Permintaan Reschedule */}
            {activeTab === 'reschedule' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-base">Permintaan Reschedule Pasien (H-1)</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-black border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6">Pasien & No. RM</th>
                                    <th className="py-4 px-6">Jadwal Baru Diumumkan</th>
                                    <th className="py-4 px-6">Alasan Reschedule</th>
                                    <th className="py-4 px-6">Status Reschedule</th>
                                    <th className="py-4 px-6 text-right">Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {(!rescheduleRequests?.data || rescheduleRequests.data.length === 0) ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-500 font-semibold">
                                            Tidak ada permohonan reschedule dengan status ini.
                                        </td>
                                    </tr>
                                ) : (
                                    rescheduleRequests.data.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900">
                                                <div>{req.patient?.user?.name}</div>
                                                <div className="text-xs text-blue-700 font-mono">{req.patient?.medical_record_number}</div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-800">
                                                <div className="font-extrabold">{req.requested_date}</div>
                                                <div className="text-slate-600 font-semibold capitalize">Shift {req.requested_shift}</div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-600 max-w-xs font-medium">
                                                {req.reason}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    req.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                    'bg-amber-100 text-amber-800 border border-amber-300'
                                                }`}>
                                                    {req.status === 'approved' ? 'Disetujui' :
                                                     req.status === 'rejected' ? 'Ditolak' :
                                                     'Pending Review'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenApproveModal(req, 'approve_reschedule')}
                                                            className="inline-flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[38px]"
                                                        >
                                                            <CheckSquare className="w-4 h-4" />
                                                            <span>Setujui & Bed</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenRejectModal(req, 'reject_reschedule')}
                                                            className="inline-flex items-center space-x-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[38px]"
                                                        >
                                                            <XSquare className="w-4 h-4" />
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
                </div>
            )}

            {/* Modal Approve & Bed Allocation */}
            {modalType?.startsWith('approve') && selectedItem && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                                <span>Setujui Permohonan & Alokasikan Bed</span>
                            </h3>
                            <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs font-semibold text-slate-600">
                            Pilih alokasi nomor bed (1-10) untuk pasien <strong className="text-slate-900">{selectedItem.patient?.user?.name}</strong>.
                        </p>

                        <form onSubmit={handleConfirmApprove} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pilih Nomor Bed (1 - 10) *</label>
                                <select
                                    value={approveData.bed_number}
                                    onChange={(e) => setApproveData('bed_number', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                    required
                                >
                                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                        <option key={n} value={String(n)}>Bed #{n}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Emergency Override Toggle */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="emergency_override_chk"
                                    checked={approveData.emergency_override}
                                    onChange={(e) => setApproveData('emergency_override', e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                                />
                                <label htmlFor="emergency_override_chk" className="text-xs font-bold text-slate-800 cursor-pointer">
                                    Bypass Slot Darurat (Emergency Override)
                                    <span className="block text-[11px] font-normal text-slate-600 mt-0.5">
                                        Centang untuk menyetujui penanganan medis darurat meskipun slot normal sudah terisi.
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingApprove}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20"
                                >
                                    {processingApprove ? 'Memproses...' : 'Setujui & Terbitkan QR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Reject */}
            {modalType?.startsWith('reject') && selectedItem && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-rose-600 flex items-center space-x-2">
                                <XSquare className="w-5 h-5" />
                                <span>Tolak Permohonan Pasien</span>
                            </h3>
                            <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs font-semibold text-slate-600">
                            Masukkan alasan penolakan permohonan untuk pasien <strong className="text-slate-900">{selectedItem.patient?.user?.name}</strong>. Alasan ini akan dikirimkan ke pasien.
                        </p>

                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alasan Penolakan *</label>
                                <textarea
                                    value={rejectData.reason}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRejectData({
                                            reason: val,
                                            admin_notes: val,
                                            rejection_reason: val,
                                        });
                                    }}
                                    placeholder="Contoh: Kuota bed shift penuh atau kondisi belum sesuai..."
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                ></textarea>
                                {(rejectErrors.reason || rejectErrors.admin_notes) && (
                                    <span className="text-xs text-rose-600 mt-1 block font-bold">
                                        {rejectErrors.reason || rejectErrors.admin_notes}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingReject}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/20"
                                >
                                    {processingReject ? 'Memproses...' : 'Konfirmasi Penolakan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Emergency Override Manual */}
            {showEmergencyModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-rose-600 flex items-center space-x-2">
                                <ShieldAlert className="w-5 h-5" />
                                <span>Emergency Override Manual Janji Temu</span>
                            </h3>
                            <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEmergencySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pilih Pasien *</label>
                                <select
                                    value={emergencyData.patient_id}
                                    onChange={(e) => setEmergencyData('patient_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                >
                                    <option value="">-- Pilih Pasien Darurat --</option>
                                    {(patients || []).map((p) => (
                                        <option key={p.id} value={p.id}>{p.user?.name} ({p.medical_record_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal *</label>
                                    <input
                                        type="date"
                                        value={emergencyData.appointment_date}
                                        onChange={(e) => setEmergencyData('appointment_date', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift *</label>
                                    <select
                                        value={emergencyData.shift}
                                        onChange={(e) => setEmergencyData('shift', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                                    >
                                        <option value="pagi">Pagi (07:00-11:00)</option>
                                        <option value="siang">Siang (12:00-16:00)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. Bed *</label>
                                    <input
                                        type="text"
                                        value={emergencyData.bed_number}
                                        onChange={(e) => setEmergencyData('bed_number', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alasan Penanganan Darurat *</label>
                                <textarea
                                    value={emergencyData.emergency_reason}
                                    onChange={(e) => setEmergencyData('emergency_reason', e.target.value)}
                                    placeholder="Penanganan kelebihan cairan akut / rujukan darurat..."
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEmergencyModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingEmergency}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-600/20"
                                >
                                    {processingEmergency ? 'Memproses...' : 'Terapkan Emergency Override'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
