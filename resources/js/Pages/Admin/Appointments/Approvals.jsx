import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckSquare, XSquare, AlertOctagon, Calendar, Clock, User, ShieldAlert, Plus, X } from 'lucide-react';

export default function AppointmentApprovalsIndex({ appointments, patients }) {
    const [selectedApp, setSelectedApp] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const { data: rejectData, setData: setRejectData, post: postReject, processing: processingReject, reset: resetReject } = useForm({
        reason: '',
    });

    const { data: emergencyData, setData: setEmergencyData, post: postEmergency, processing: processingEmergency, reset: resetEmergency } = useForm({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        shift: 'pagi',
        bed_number: 1,
        emergency_reason: '',
    });

    const handleApprove = (app) => {
        if (confirm(`Setujui janji temu untuk ${app.patient?.user?.name}?`)) {
            router.post(route('admin.appointment-approvals.approve', app.id));
        }
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!selectedApp) return;
        postReject(route('admin.appointment-approvals.reject', selectedApp.id), {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedApp(null);
                resetReject();
            }
        });
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

    return (
        <AdminLayout title="Approval Janji Temu & Emergency Override">
            <Head title="Approval Janji Temu — Antrean Hemodialisis" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Persetujuan Janji Temu & Slot Darurat (T-603)</h2>
                    <p className="text-sm text-slate-500">Tinjau pengajuan janji temu pasien dan lakukan override darurat (Emergency Override) jika diperlukan.</p>
                </div>

                <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20"
                >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Emergency Override Manual</span>
                </button>
            </div>

            {/* Table Pending Approvals */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-8">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-base">Permintaan Janji Temu Pending Review</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6">Pasien & No. RM</th>
                                <th className="py-4 px-6">Tanggal & Shift</th>
                                <th className="py-4 px-6">Alokasi Bed</th>
                                <th className="py-4 px-6">Status Approval</th>
                                <th className="py-4 px-6 text-right">Aksi Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {appointments.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-400">
                                        Tidak ada permintaan janji temu yang menunggu persetujuan.
                                    </td>
                                </tr>
                            ) : (
                                appointments.data.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            <div>{app.patient?.user?.name}</div>
                                            <div className="text-xs text-blue-700 font-mono">{app.patient?.medical_record_number}</div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-800">
                                            <div className="font-semibold">{app.appointment_date}</div>
                                            <div className="text-slate-500 capitalize">Shift {app.shift}</div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-800 font-bold">
                                            Bed #{app.bed_number || '1'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                Pending Review
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleApprove(app)}
                                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                                            >
                                                <CheckSquare className="w-3.5 h-3.5" />
                                                <span>Setujui</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    setShowRejectModal(true);
                                                }}
                                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                                            >
                                                <XSquare className="w-3.5 h-3.5" />
                                                <span>Tolak</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Reject */}
            {showRejectModal && selectedApp && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-rose-600 mb-2">Tolak Permintaan Janji Temu</h3>
                        <p className="text-xs text-slate-600 mb-4">
                            Masukkan alasan penolakan janji temu untuk pasien <strong className="text-slate-900">{selectedApp.patient?.user?.name}</strong>.
                        </p>
                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alasan Penolakan *</label>
                                <textarea
                                    value={rejectData.reason}
                                    onChange={(e) => setRejectData('reason', e.target.value)}
                                    placeholder="Contoh: Kuota shift penuh atau jadwalkan ulang..."
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
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
                                >
                                    {processingReject ? 'Memproses...' : 'Tolak Janji Temu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Emergency Override */}
            {showEmergencyModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-bold text-rose-600 flex items-center space-x-2">
                                <ShieldAlert className="w-5 h-5" />
                                <span>Emergency Override Manual Janji Temu</span>
                            </h3>
                            <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEmergencySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pilih Pasien *</label>
                                <select
                                    value={emergencyData.patient_id}
                                    onChange={(e) => setEmergencyData('patient_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                >
                                    <option value="">-- Pilih Pasien Darurat --</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>{p.user?.name} ({p.medical_record_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tanggal *</label>
                                    <input
                                        type="date"
                                        value={emergencyData.appointment_date}
                                        onChange={(e) => setEmergencyData('appointment_date', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shift *</label>
                                    <select
                                        value={emergencyData.shift}
                                        onChange={(e) => setEmergencyData('shift', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                                    >
                                        <option value="pagi">Pagi (07:00-11:00)</option>
                                        <option value="siang">Siang (12:00-16:00)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">No. Bed *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={emergencyData.bed_number}
                                        onChange={(e) => setEmergencyData('bed_number', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alasan Penanganan Darurat *</label>
                                <textarea
                                    value={emergencyData.emergency_reason}
                                    onChange={(e) => setEmergencyData('emergency_reason', e.target.value)}
                                    placeholder="Penanganan kelebihan cairan akut / rujukan darurat..."
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEmergencyModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingEmergency}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20"
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
