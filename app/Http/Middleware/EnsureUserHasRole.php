<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user() || $request->user()->role !== $role) {
            if ($request->user() && $request->user()->role === 'admin') {
                return redirect()->route('admin.dashboard');
            } elseif ($request->user() && $request->user()->role === 'patient') {
                return redirect()->route('patient.dashboard');
            }
            return redirect()->route('login');
        }

        return $next($request);
    }
}
