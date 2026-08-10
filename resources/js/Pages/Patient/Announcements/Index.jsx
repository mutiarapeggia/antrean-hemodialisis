import React from 'react';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';
import { Bell, Calendar, Megaphone } from 'lucide-react';

export default function PatientAnnouncementsIndex({ announcements }) {
    return (
        <PatientLayout title="Pengumuman Klinik">
            <Head title="Pengumuman Klinik — Antrean Hemodialisis" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
                        <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-100">Pengumuman & Informasi Terbaru Klinik</h1>
                            <p className="text-xs text-slate-400">Informasi operasional, jadwal pelayanan libur nasional, dan imbauan untuk pasien hemodialisis.</p>
                        </div>
                    </div>

                    {announcements.data.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                            Belum ada pengumuman baru dari klinik.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.data.map((ann) => (
                                <div key={ann.id} className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-blue-300">{ann.title}</h2>
                                        <span className="text-xs font-mono text-slate-500 flex items-center space-x-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{ann.publish_date}</span>
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                        {ann.content}
                                    </p>
                                    <div className="pt-2 text-[11px] text-slate-500">
                                        Diterbitkan oleh: Staf Administrasi Klinik Hemodialisis
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {announcements.links && announcements.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800 flex justify-end space-x-1 mt-6">
                            {announcements.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PatientLayout>
    );
}
