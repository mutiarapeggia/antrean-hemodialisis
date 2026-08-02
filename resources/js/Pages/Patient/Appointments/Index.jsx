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

export default function Index({ appointments, patient }) {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [viewingQr, setViewingQr] = useState(null);
    const [cancellingApp, setCancellingApp] = useState(null);
    const [rescheduleApp, setRescheduleApp] = useState(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

            {/* Header Banner - Solid Clean Dark Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Pusat Layanan Pasien</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Jadwal Janji Temu Hemodialisis</h1>
                    <p className="text-sm text-slate-300 mt-1">
                        Pasien: <strong className="text-white">{patient?.user?.name}</strong> | No. RM: <span className="font-mono text-blue-400">{patient?.medical_record_number}</span>
                    </p>
                </div>

                <button
                    onClick={() => setIsBookingOpen(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/40"
                >
                    <Plus className="w-5 h-5" />
                    <span>Daftar Janji Temu Baru</span>
                </button>
            </div>

            {/* Appointments List Grid */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-blue-400" />
                    <span>Daftar Riwayat & Jadwal Mandiri</span>
                </h2>

                {appointments.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-base font-semibold text-slate-300">Belum ada janji temu yang terdaftar.</p>
                        <p className="text-xs text-slate-500 mt-1">Klik tombol di atas untuk mendaftarkan jadwal hemodialisis Anda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {appointments.map((app) => {
                            const appDate = app.appointment_date ? app.appointment_date.substring(0, 10) : '';
                            const isScheduled = app.status === 'scheduled';
                            const latestReschedule = app.latest_reschedule_request;
                            const hasPendingReschedule = latestReschedule && latestReschedule.status === 'pending';

                            return (
                                <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                app.shift === 'pagi' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            }`}>
                                                Shift {app.shift} ({app.shift === 'pagi' ? '07:00-11:00' : '12:00-16:00'})
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {hasPendingReschedule && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                                                        <span>Reschedule Pending</span>
                                                    </span>
                                                )}

                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                    app.status === 'checked-in' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                    app.status === 'completed' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                    app.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                    app.status === 'no-show' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                    app.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                    'bg-slate-800 text-slate-300 border border-slate-700'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-2xl font-bold text-white font-mono">{appDate}</p>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                                                <Bed className="w-4 h-4 text-blue-400" />
                                                <span>Posisi Bed: <strong className="text-slate-200">{app.bed_number ? (app.bed_number.startsWith('Bed') ? app.bed_number : `Bed ${app.bed_number}`) : 'Sesuai Arahan Petugas'}</strong></span>
                                            </p>
                                        </div>

                                        {app.status === 'cancelled' && app.cancellation_reason && (
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4 text-xs text-rose-300">
                                                <strong>Alasan Pembatalan:</strong> {app.cancellation_reason}
                                            </div>
                                        )}

                                        {latestReschedule && (
                                            <div className={`p-3 rounded-xl mb-4 text-xs border ${
                                                latestReschedule.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                                                latestReschedule.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                                                'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                            }`}>
                                                <p className="font-bold uppercase tracking-wider">Info Reschedule ({latestReschedule.status})</p>
                                                <p className="mt-0.5">Permohonan ke: {latestReschedule.requested_date ? latestReschedule.requested_date.substring(0, 10) : ''} (Shift {latestReschedule.requested_shift})</p>
                                                {latestReschedule.admin_notes && (
                                                    <p className="mt-1 text-[11px] italic">Catatan Admin: {latestReschedule.admin_notes}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => setViewingQr(app)}
                                                className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-xl border border-blue-500/20"
                                            >
                                                <QrCode className="w-4 h-4 text-cyan-400" />
                                                <span>Kode QR</span>
                                            </button>

                                            {/* Tombol Ajukan Reschedule (H-1) untuk janji temu 'scheduled' */}
                                            {isScheduled && (
                                                hasPendingReschedule ? (
                                                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                                        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                                        <span>Reschedule Pending</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => openRescheduleModal(app)}
                                                        className="bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Ajukan Reschedule (H-1)</span>
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {app.status !== 'cancelled' && app.status !== 'completed' && (
                                            <button
                                                onClick={() => setCancellingApp(app)}
                                                className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                <Plus className="w-5 h-5 text-blue-400" />
                                <span>Pendaftaran Janji Temu</span>
                            </h3>
                            <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Janji Temu</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={bookingForm.data.appointment_date}
                                    onChange={(e) => bookingForm.setData('appointment_date', e.target.value)}
                                    style={{ colorScheme: 'dark' }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                                    required
                                />
                                {bookingForm.errors.appointment_date && (
                                    <p className="text-xs text-rose-400 mt-1">{bookingForm.errors.appointment_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Shift Perawatan</label>
                                <select
                                    value={bookingForm.data.shift}
                                    onChange={(e) => bookingForm.setData('shift', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="pagi">Shift Pagi (07:00 - 11:00 WIB)</option>
                                    <option value="siang">Shift Siang (12:00 - 16:00 WIB)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Permintaan Posisi Bed (Opsional)</label>
                                <select
                                    value={bookingForm.data.bed_number}
                                    onChange={(e) => bookingForm.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>Bed {num}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsBookingOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingForm.processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                <RefreshCw className="w-5 h-5 text-amber-400" />
                                <span>Permohonan Reschedule (H-1)</span>
                            </h3>
                            <button onClick={() => setRescheduleApp(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                                <p>Jadwal Saat Ini: <strong className="text-white">{rescheduleApp.appointment_date ? rescheduleApp.appointment_date.substring(0, 10) : ''} (Shift {rescheduleApp.shift})</strong></p>
                                <p className="text-[11px] text-amber-400 mt-1">* Reschedule harus diajukan minimal H-1 sebelum tanggal janji temu baru.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Baru Yang Diminta</label>
                                <input
                                    type="date"
                                    min={tomorrowStr}
                                    value={rescheduleForm.data.requested_date}
                                    onChange={(e) => rescheduleForm.setData('requested_date', e.target.value)}
                                    style={{ colorScheme: 'dark' }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                                    required
                                />
                                {rescheduleForm.errors.requested_date && (
                                    <p className="text-xs text-rose-400 mt-1 font-semibold">{rescheduleForm.errors.requested_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Baru</label>
                                <select
                                    value={rescheduleForm.data.requested_shift}
                                    onChange={(e) => rescheduleForm.setData('requested_shift', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="pagi">Shift Pagi (07:00 - 11:00 WIB)</option>
                                    <option value="siang">Shift Siang (12:00 - 16:00 WIB)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Alasan Permintaan Reschedule (Opsional)</label>
                                <textarea
                                    value={rescheduleForm.data.reason}
                                    onChange={(e) => rescheduleForm.setData('reason', e.target.value)}
                                    placeholder="Jelaskan alasan perubahan jadwal Anda..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setRescheduleApp(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rescheduleForm.processing}
                                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-600/30"
                                >
                                    Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QR CODE VIEW */}
            {viewingQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
                        <button onClick={() => setViewingQr(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-white mb-1">Kode QR Check-In</h3>
                        <p className="text-xs text-slate-400 mb-4">Tunjukkan kode QR ini ke scanner kiosk klinik</p>

                        <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-inner">
                            {viewingQr.qr_svg ? (
                                <div dangerouslySetInnerHTML={{ __html: viewingQr.qr_svg }} />
                            ) : (
                                <QrCode className="w-40 h-40 text-slate-900 mx-auto" />
                            )}
                        </div>

                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 font-mono break-all text-left">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans mb-0.5">Token Signatures:</span>
                            {viewingQr.qr_token}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BATALKAN JANJI TEMU */}
            {cancellingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                            <h3 className="text-lg font-bold text-rose-400 flex items-center space-x-2">
                                <XCircle className="w-5 h-5" />
                                <span>Batalkan Janji Temu</span>
                            </h3>
                            <button onClick={() => setCancellingApp(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="space-y-4">
                            <p className="text-xs text-slate-300">
                                Apakah Anda yakin ingin membatalkan janji temu pada tanggal <strong className="text-white">{cancellingApp.appointment_date ? cancellingApp.appointment_date.substring(0, 10) : ''}</strong>?
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Alasan Pembatalan</label>
                                <textarea
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                    placeholder="Isi alasan pembatalan Anda..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-rose-500 focus:outline-none"
                                    required
                                />
                                {cancelForm.errors.cancellation_reason && (
                                    <p className="text-xs text-rose-400 mt-1">{cancelForm.errors.cancellation_reason}</p>
                                )}
                            </div>

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setCancellingApp(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/30"
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
