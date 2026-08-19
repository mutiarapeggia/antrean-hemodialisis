<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    public function index(Request $request): Response
    {
        $patient = auth()->user()->patient;

        // Fetch active announcements & audit logs for notifications center
        $announcements = Announcement::where('is_active', true)
            ->latest('publish_date')
            ->take(10)
            ->get();

        $notifications = AuditLog::where(function ($q) use ($patient) {
            if ($patient) {
                $q->where('description', 'like', "%{$patient->medical_record_number}%")
                  ->orWhere('description', 'like', "%{$patient->user->name}%");
            }
        })->latest()->take(20)->get();

        return Inertia::render('Patient/Notifications/Index', [
            'patient' => $patient ? $patient->load('user') : null,
            'announcements' => $announcements,
            'notifications' => $notifications,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'notification_preference' => 'required|in:email,whatsapp,both,email_and_wa,wa_only,email_only',
            'whatsapp_number' => 'nullable|string|max:25',
        ]);

        $user = auth()->user();
        $patient = $user->patient;

        if ($patient) {
            $patient->update([
                'notification_preference' => $request->notification_preference,
                'whatsapp_number' => $request->whatsapp_number,
                'phone' => $request->whatsapp_number ?: $patient->phone,
            ]);
        }

        return back()->with('success', 'Preferensi saluran notifikasi & nomor WhatsApp berhasil diperbarui.');
    }
}
