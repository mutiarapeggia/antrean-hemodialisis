<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
            'medical_conditions' => 'nullable|string|max:1000',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        DB::transaction(function () use ($request, &$user) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'patient',
            ]);

            $rmNumber = 'RM-' . date('Ym') . '-' . str_pad((Patient::count() + 1), 3, '0', STR_PAD_LEFT);

            Patient::create([
                'user_id' => $user->id,
                'medical_record_number' => $rmNumber,
                'phone' => $request->phone ?? '-',
                'address' => $request->address ?? null,
                'medical_conditions' => $request->medical_conditions ?? null,
                'is_active' => true,
            ]);
        });

        event(new Registered($user));

        return redirect(route('login'))->with('status', 'Registrasi berhasil, silakan masuk ke akun Anda.');
    }
}
