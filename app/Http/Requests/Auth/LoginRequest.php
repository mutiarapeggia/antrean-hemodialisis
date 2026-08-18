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
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginInput = trim($this->input('email'));
        $password = $this->input('password');

        $emailToTry = $loginInput;

        if (strtolower($loginInput) === 'admin') {
            $adminUser = User::where('role', 'admin')->first();
            if ($adminUser) {
                $emailToTry = $adminUser->email;
            }
        } elseif (str_starts_with(strtoupper($loginInput), 'RM-')) {
            $patient = Patient::where('medical_record_number', strtoupper($loginInput))->first();
            if ($patient && $patient->user) {
                $emailToTry = $patient->user->email;
            }
        }

        if (! Auth::attempt(['email' => $emailToTry, 'password' => $password], $this->boolean('remember'))) {
            // Backup attempt by username/name
            $userByName = User::where('name', $loginInput)->first();
            if ($userByName && Auth::attempt(['email' => $userByName->email, 'password' => $password], $this->boolean('remember'))) {
                RateLimiter::clear($this->throttleKey());
                return;
            }

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
