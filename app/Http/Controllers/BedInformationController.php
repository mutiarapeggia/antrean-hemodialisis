<?php

namespace App\Http\Controllers;

use App\Models\Bed;
use Inertia\Inertia;
use Inertia\Response;

class BedInformationController extends Controller
{
    public function index(): Response
    {
        $beds = Bed::all()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

        $stats = [
            'total' => $beds->count(),
            'available' => $beds->where('status', 'available')->count(),
            'occupied' => $beds->where('status', 'occupied')->count(),
            'maintenance_damaged' => $beds->whereIn('status', ['maintenance', 'damaged'])->count(),
        ];

        return Inertia::render('BedInformation/Index', [
            'beds' => $beds,
            'stats' => $stats,
            'lastUpdated' => now()->format('H:i:s'),
        ]);
    }
}
