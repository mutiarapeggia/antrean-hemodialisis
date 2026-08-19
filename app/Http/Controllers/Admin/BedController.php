<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BedController extends Controller
{
    public function index(): Response
    {
        $beds = Bed::all()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

        return Inertia::render('Admin/Beds/Index', [
            'beds' => $beds,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bed_number' => 'required|string|max:50|unique:beds,bed_number',
            'label' => 'required|string|max:255',
            'status' => 'required|in:available,occupied,maintenance,damaged',
            'notes' => 'nullable|string',
        ]);

        Bed::create($validated);

        return redirect()->back()->with('success', 'Master Bed berhasil ditambahkan.');
    }

    public function update(Request $request, Bed $bed): RedirectResponse
    {
        $validated = $request->validate([
            'bed_number' => 'required|string|max:50|unique:beds,bed_number,' . $bed->id,
            'label' => 'required|string|max:255',
            'status' => 'required|in:available,occupied,maintenance,damaged',
            'notes' => 'nullable|string',
        ]);

        $bed->update($validated);

        return redirect()->back()->with('success', 'Data Bed berhasil diperbarui.');
    }

    public function destroy(Bed $bed): RedirectResponse
    {
        $bed->delete();

        return redirect()->back()->with('success', 'Master Bed berhasil dihapus.');
    }
}
