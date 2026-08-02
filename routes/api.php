<?php

use App\Http\Controllers\Api\CheckInController;
use Illuminate\Support\Facades\Route;

Route::post('/check-in', [CheckInController::class, 'checkIn'])->name('api.check-in');
