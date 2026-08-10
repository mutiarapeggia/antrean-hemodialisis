<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $announcements = Announcement::with('admin')
            ->where('is_active', true)
            ->whereDate('publish_date', '<=', now()->toDateString())
            ->orderBy('publish_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Patient/Announcements/Index', [
            'announcements' => $announcements,
        ]);
    }
}
