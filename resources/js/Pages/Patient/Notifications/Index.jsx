import React, { useState } from 'react';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, useForm } from '@inertiajs/react';
import { Bell, Smartphone, Mail, Settings, Megaphone, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export default function PatientNotificationsIndex({ patient, announcements, notifications }) {
    const { data, setData, post, processing, errors, flash } = useForm({
        notification_preference: patient?.notification_preference || 'both',
        whatsapp_number: patient?.whatsapp_number || patient?.phone || '',
    });

    const handleSubmitPreference = (e) => {
        e.preventDefault();
        post(route('patient.notifications.update'));
    };

    return (
        <PatientLayout title="Notifikasi & Preferensi WhatsApp / Email">
            <Head title="Notifikasi & Preferensi — Antrean Hemodialisis" />

            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl border border-blue-200">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Pusat Notifikasi & Pengaturan WA/Email</h1>
                            <p className="text-sm text-slate-600">Atur preferensi media pengiriman pengingat jadwal, status check-in, dan pengumuman klinik.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left 1-col: Preference Settings Form (T-608) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
                            <Settings className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Pengaturan Saluran</h2>
                        </div>

                        <form onSubmit={handleSubmitPreference} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">Saluran Pengiriman Notifikasi *</label>
                                <div className="space-y-2">
                                    <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        data.notification_preference === 'both' ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="preference"
                                            value="both"
                                            checked={data.notification_preference === 'both'}
                                            onChange={(e) => setData('notification_preference', e.target.value)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Email + WhatsApp (Rekomendasi)</span>
                                    </label>

                                    <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        data.notification_preference === 'whatsapp' ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="preference"
                                            value="whatsapp"
                                            checked={data.notification_preference === 'whatsapp'}
                                            onChange={(e) => setData('notification_preference', e.target.value)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Hanya WhatsApp</span>
                                    </label>

                                    <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        data.notification_preference === 'email' ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="preference"
                                            value="email"
                                            checked={data.notification_preference === 'email'}
                                            onChange={(e) => setData('notification_preference', e.target.value)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Hanya Email SMTP</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Nomor WhatsApp Pasien</label>
                                <div className="relative">
                                    <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={data.whatsapp_number}
                                        onChange={(e) => setData('whatsapp_number', e.target.value)}
                                        placeholder="081234567890"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                {errors.whatsapp_number && <span className="text-xs text-rose-600 mt-1 block">{errors.whatsapp_number}</span>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Preferensi Notifikasi'}
                            </button>
                        </form>
                    </div>

                    {/* Right 2-cols: Interactive Activity Notifications & Announcements */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Announcements Feed Card */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Pengumuman Klinik Terkini</h2>
                            </div>

                            {announcements.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4">Belum ada pengumuman baru.</p>
                            ) : (
                                announcements.map((ann) => (
                                    <div key={ann.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-blue-900 text-sm">{ann.title}</h3>
                                            <span className="text-xs font-mono text-slate-500">{ann.publish_date}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed">{ann.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Recent Alerts Feed Card */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-lg font-bold text-slate-900">Riwayat Notifikasi Layanan Anda</h2>
                            </div>

                            {notifications.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4">Belum ada riwayat aktivitas tersimpan.</p>
                            ) : (
                                notifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                        <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-slate-900">{notif.action}</p>
                                            <p className="text-slate-600 mt-0.5">{notif.description}</p>
                                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                                {new Date(notif.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
