<?php

namespace App\Http\Requests\Auth;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginInput = trim($this->input('login') ?? $this->input('email') ?? '');
        $password = (string) $this->input('password');

        if (empty($loginInput)) {
            throw ValidationException::withMessages([
                'email' => 'Silakan masukkan username, email, atau No. RM Anda.',
            ]);
        }

        // 1. Check direct Email match
        $user = User::where('email', $loginInput)->first();

        // 2. Check Username / Name match
        if (! $user) {
            $user = User::where('name', $loginInput)->first();
        }

        // 3. Check Medical Record Number (No. RM) match
        if (! $user) {
            $patient = Patient::where('medical_record_number', strtoupper($loginInput))->first();
            if ($patient && $patient->user) {
                $user = $patient->user;
            }
        }

        // 4. Special fallback for 'admin' username
        if (! $user && strtolower($loginInput) === 'admin') {
            $user = User::where('role', 'admin')->first();
        }

        $emailToAttempt = $user ? $user->email : $loginInput;

        if (! Auth::attempt(['email' => $emailToAttempt, 'password' => $password], $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
