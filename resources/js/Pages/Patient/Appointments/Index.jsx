import React, { useState } from 'react';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Clock, 
    QrCode, 
    Bed, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    X, 
    ShieldCheck, 
    FileText,
    RefreshCw
} from 'lucide-react';

export default function Index({ appointments, patient, availableBeds = [] }) {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [viewingQr, setViewingQr] = useState(null);
    const [cancellingApp, setCancellingApp] = useState(null);
    const [rescheduleApp, setRescheduleApp] = useState(null);

    const isQrAllowed = (app) => {
        if (!app) return false;

        // 1. Initial pending approval check
        if (app.status === 'pending_approval' || app.status === 'pending' || app.approval_status === 'pending_approval') {
            return false;
        }

        // 2. Pending reschedule request check
        const latestReschedule = app.latest_reschedule_request || app.latestRescheduleRequest;
        if (latestReschedule && latestReschedule.status === 'pending') {
            return false;
        }

        // 3. Status must be scheduled, approved, checked-in, in-progress, or completed
        const allowedStatuses = ['scheduled', 'approved', 'checked-in', 'in-progress', 'completed'];
        return allowedStatuses.includes(app.status) || app.approval_status === 'approved';
    };

    const getWibDateStr = (dateObj = new Date()) => new Date(dateObj).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const todayStr = getWibDateStr();
    const tomorrowStr = getWibDateStr(new Date(Date.now() + 86400000));

    const bookingForm = useForm({
        appointment_date: todayStr,
        shift: 'pagi',
        bed_number: '1',
    });

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        bookingForm.post(route('patient.appointments.store'), {
            onSuccess: () => {
                setIsBookingOpen(false);
                bookingForm.reset();
            },
        });
    };

    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        cancelForm.post(route('patient.appointments.cancel', cancellingApp.id), {
            onSuccess: () => {
                setCancellingApp(null);
                cancelForm.reset();
            },
        });
    };

    const rescheduleForm = useForm({
        appointment_id: '',
        requested_date: tomorrowStr,
        requested_shift: 'pagi',
        reason: '',
    });

    const openRescheduleModal = (app) => {
        setRescheduleApp(app);
        rescheduleForm.setData({
            appointment_id: app.id,
            requested_date: tomorrowStr,
            requested_shift: app.shift || 'pagi',
            reason: '',
        });
        rescheduleForm.clearErrors();
    };

    const handleRescheduleSubmit = (e) => {
        e.preventDefault();
        rescheduleForm.post(route('patient.reschedule.store'), {
            onSuccess: () => {
                setRescheduleApp(null);
                rescheduleForm.reset();
            },
        });
    };

    return (
        <PatientLayout title="Janji Temu Saya">
            <Head title="Janji Temu Saya - Pasien" />

            {/* Header Banner - Solid Clean Light Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-600">Pusat Layanan Pasien</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Jadwal Janji Temu Hemodialisis</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-1">
                        Pasien: <strong className="text-slate-900">{patient?.user?.name}</strong> | No. RM: <span className="font-mono text-blue-600 font-bold">{patient?.medical_record_number}</span>
                    </p>
                </div>

                <button
                    onClick={() => setIsBookingOpen(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-blue-600/30"
                >
                    <Plus className="w-5 h-5" />
                    <span>Daftar Janji Temu Baru</span>
                </button>
            </div>

            {/* Appointments List Grid */}
            <div className="space-y-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <span>Daftar Riwayat & Jadwal Mandiri</span>
                </h2>

                {appointments.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-base font-bold text-slate-700">Belum ada janji temu yang terdaftar.</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Klik tombol di atas untuk mendaftarkan jadwal hemodialisis Anda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {appointments.map((app) => {
                            const appDate = app.appointment_date ? app.appointment_date.substring(0, 10) : '';
                            const isScheduled = app.status === 'scheduled';
                            const latestReschedule = app.latest_reschedule_request;
                            const hasPendingReschedule = latestReschedule && latestReschedule.status === 'pending';

                            return (
                                <div key={app.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                app.shift === 'pagi' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                            }`}>
                                                Shift {app.shift} ({app.shift === 'pagi' ? '07:00-11:00' : '12:00-16:00'})
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {hasPendingReschedule && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                                                        <span>Reschedule Pending</span>
                                                    </span>
                                                )}

                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                    app.status === 'checked-in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    app.status === 'completed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                                                    app.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                    app.status === 'no-show' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                                    'bg-blue-100 text-blue-800 border border-blue-300'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-2xl font-black text-slate-900 font-mono">{appDate}</p>
                                            <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center space-x-2">
                                                <Bed className="w-4 h-4 text-blue-600" />
                                                <span>Posisi Bed: <strong className="text-slate-900 font-bold">{app.bed_number ? (app.bed_number.startsWith('Bed') ? app.bed_number : `Bed ${app.bed_number}`) : 'Sesuai Arahan Petugas'}</strong></span>
                                            </p>
                                        </div>

                                        {app.status === 'cancelled' && app.cancellation_reason && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-xs font-semibold text-rose-800">
                                                <strong>Alasan Pembatalan:</strong> {app.cancellation_reason}
                                            </div>
                                        )}

                                        {latestReschedule && (
                                            <div className={`p-3 rounded-xl mb-4 text-xs border font-semibold ${
                                                latestReschedule.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                                                latestReschedule.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                                                'bg-amber-50 border-amber-200 text-amber-900'
                                            }`}>
                                                <p className="font-black uppercase tracking-wider">Info Reschedule ({latestReschedule.status})</p>
                                                <p className="mt-0.5">Permohonan ke: {latestReschedule.requested_date ? latestReschedule.requested_date.substring(0, 10) : ''} (Shift {latestReschedule.requested_shift})</p>
                                                {latestReschedule.admin_notes && (
                                                    <p className="mt-1 text-[11px] italic font-normal">Catatan Admin: {latestReschedule.admin_notes}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {(app.approval_status === 'pending_approval' || app.status === 'pending') ? (
                                                <span className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                                    <span>Menunggu Persetujuan Admin</span>
                                                </span>
                                            ) : hasPendingReschedule ? (
                                                <span className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                                    <span>Pengajuan Jadwal Ulang Sedang Ditinjau Admin</span>
                                                </span>
                                            ) : isQrAllowed(app) ? (
                                                <button
                                                    onClick={() => setViewingQr(app)}
                                                    className="inline-flex items-center space-x-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition-colors"
                                                >
                                                    <QrCode className="w-4 h-4 text-blue-600" />
                                                    <span>Kode QR Tiket</span>
                                                </button>
                                            ) : null}

                                            {isScheduled && (
                                                hasPendingReschedule ? null : (
                                                    <button
                                                        onClick={() => openRescheduleModal(app)}
                                                        className="bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>Ajukan Reschedule (H-1)</span>
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {app.status !== 'cancelled' && app.status !== 'completed' && (
                                            <button
                                                onClick={() => setCancellingApp(app)}
                                                className="text-xs font-bold text-rose-700 hover:bg-rose-100 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 transition-colors"
                                            >
                                                Batalkan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL DAFTAR JANJI TEMU MANDIRI */}
            {isBookingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                <span>Pendaftaran Janji Temu</span>
                            </h3>
                            <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tanggal Janji Temu</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={bookingForm.data.appointment_date}
                                    onChange={(e) => bookingForm.setData('appointment_date', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {bookingForm.errors.appointment_date && (
                                    <p className="text-xs font-bold text-rose-600 mt-1">{bookingForm.errors.appointment_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pilih Shift Perawatan</label>
                                <select
                                    value={bookingForm.data.shift}
                                    onChange={(e) => bookingForm.setData('shift', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                >
                                    <option value="pagi">Shift Pagi (07:00 - 11:00 WIB)</option>
                                    <option value="siang">Shift Siang (12:00 - 16:00 WIB)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Permintaan Posisi Bed (Opsional)</label>
                                <select
                                    value={bookingForm.data.bed_number}
                                    onChange={(e) => bookingForm.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none"
                                >
                                    {availableBeds && availableBeds.length > 0 ? (
                                        availableBeds.map((bed) => (
                                            <option key={bed.id} value={bed.bed_number}>
                                                {bed.bed_number} ({bed.label})
                                            </option>
                                        ))
                                    ) : (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <option key={num} value={`Bed ${num}`}>Bed {num}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsBookingOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingForm.processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-blue-600/30"
                                >
                                    Konfirmasi Pendaftaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL AJUKAN RESCHEDULE (H-1) */}
            {rescheduleApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <RefreshCw className="w-5 h-5 text-amber-600" />
                                <span>Permohonan Reschedule (H-1)</span>
                            </h3>
                            <button onClick={() => setRescheduleApp(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-semibold">
                                <p>Jadwal Saat Ini: <strong className="text-slate-900 font-bold">{rescheduleApp.appointment_date ? rescheduleApp.appointment_date.substring(0, 10) : ''} (Shift {rescheduleApp.shift})</strong></p>
                                <p className="text-[11px] text-amber-700 mt-1 font-bold">* Reschedule harus diajukan minimal H-1 sebelum tanggal janji temu baru.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tanggal Baru Yang Diminta</label>
                                <input
                                    type="date"
                                    min={tomorrowStr}
                                    value={rescheduleForm.data.requested_date}
                                    onChange={(e) => rescheduleForm.setData('requested_date', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-amber-600 focus:outline-none"
                                    required
                                />
                                {rescheduleForm.errors.requested_date && (
                                    <p className="text-xs font-bold text-rose-600 mt-1">{rescheduleForm.errors.requested_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Shift Baru</label>
                                <select
                                    value={rescheduleForm.data.requested_shift}
                                    onChange={(e) => rescheduleForm.setData('requested_shift', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-amber-600 focus:outline-none"
                                >
                                    <option value="pagi">Shift Pagi (07:00 - 11:00 WIB)</option>
                                    <option value="siang">Shift Siang (12:00 - 16:00 WIB)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alasan Permintaan Reschedule (Opsional)</label>
                                <textarea
                                    value={rescheduleForm.data.reason}
                                    onChange={(e) => rescheduleForm.setData('reason', e.target.value)}
                                    placeholder="Jelaskan alasan perubahan jadwal Anda..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-amber-600 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setRescheduleApp(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rescheduleForm.processing}
                                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-amber-600/30"
                                >
                                    Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QR CODE VIEW */}
            {viewingQr && isQrAllowed(viewingQr) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
                        <button onClick={() => setViewingQr(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-black text-slate-900 mb-1">Kode QR Check-In</h3>
                        <p className="text-xs font-semibold text-slate-600 mb-4">Tunjukkan kode QR ini ke scanner kiosk klinik</p>

                        <div className="bg-slate-50 p-4 rounded-2xl inline-block mb-4 border border-slate-200 shadow-inner">
                            {viewingQr.qr_svg ? (
                                String(viewingQr.qr_svg).startsWith('data:') ? (
                                    <img 
                                        src={viewingQr.qr_svg} 
                                        alt="Kode QR Check-In" 
                                        className="w-48 h-48 mx-auto rounded-xl bg-white p-2 border border-slate-200 shadow-xs" 
                                    />
                                ) : (
                                    <div 
                                        className="w-48 h-48 mx-auto flex items-center justify-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs" 
                                        dangerouslySetInnerHTML={{ __html: viewingQr.qr_svg }} 
                                    />
                                )
                            ) : (
                                <QrCode className="w-48 h-48 text-slate-900 mx-auto" />
                            )}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                            <span className="text-xs font-extrabold text-slate-500 uppercase block tracking-wider mb-1 font-sans">Nomor Rekam Medis (No. RM):</span>
                            <span className="text-xl font-black text-slate-900 font-mono tracking-wider">
                                {patient?.medical_record_number || viewingQr.patient?.medical_record_number || 'RM-9901'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BATALKAN JANJI TEMU */}
            {cancellingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-rose-600 flex items-center space-x-2">
                                <XCircle className="w-5 h-5" />
                                <span>Batalkan Janji Temu</span>
                            </h3>
                            <button onClick={() => setCancellingApp(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="space-y-4">
                            <p className="text-xs font-semibold text-slate-700">
                                Apakah Anda yakin ingin membatalkan janji temu pada tanggal <strong className="text-slate-900 font-black">{cancellingApp.appointment_date ? cancellingApp.appointment_date.substring(0, 10) : ''}</strong>?
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alasan Pembatalan</label>
                                <textarea
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                    placeholder="Isi alasan pembatalan Anda..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold text-sm focus:border-rose-600 focus:outline-none"
                                    required
                                />
                                {cancelForm.errors.cancellation_reason && (
                                    <p className="text-xs font-bold text-rose-600 mt-1">{cancelForm.errors.cancellation_reason}</p>
                                )}
                            </div>

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setCancellingApp(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-rose-600/30"
                                >
                                    Konfirmasi Pembatalan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PatientLayout>
    );
}
