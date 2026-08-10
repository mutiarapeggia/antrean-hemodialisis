<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Announcement::with('admin');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->orderBy('publish_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'publish_date' => ['required', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $announcement = Announcement::create([
            'admin_id' => auth()->id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'publish_date' => $validated['publish_date'],
            'is_active' => $validated['is_active'],
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_CREATED',
            'description' => "Pengumuman baru dibuat: '{$announcement->title}'.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Pengumuman baru berhasil diterbitkan.');
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'publish_date' => ['required', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $announcement->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_UPDATED',
            'description' => "Pengumuman diperbarui: '{$announcement->title}'.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function toggleStatus(Request $request, Announcement $announcement): RedirectResponse
    {
        $announcement->update([
            'is_active' => ! $announcement->is_active,
        ]);

        $statusText = $announcement->is_active ? 'diaktifkan' : 'dinonaktifkan';

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_STATUS_TOGGLED',
            'description' => "Status pengumuman '{$announcement->title}' diubah menjadi {$statusText}.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', "Status pengumuman berhasil {$statusText}.");
    }

    public function destroy(Request $request, Announcement $announcement): RedirectResponse
    {
        $title = $announcement->title;
        $announcement->delete();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ANNOUNCEMENT_DELETED',
            'description' => "Pengumuman dihapus: '{$title}'.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Pengumuman berhasil dihapus.');
    }
}
