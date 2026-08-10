<?php

use App\Http\Controllers\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\MedicationController as AdminMedicationController;
use App\Http\Controllers\Admin\PatientController;
use App\Http\Controllers\Admin\QueueController as AdminQueueController;
use App\Http\Controllers\Admin\RescheduleRequestController as AdminRescheduleRequestController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Patient\AnnouncementController as PatientAnnouncementController;
use App\Http\Controllers\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Patient\DashboardController as PatientDashboardController;
use App\Http\Controllers\Patient\RescheduleRequestController as PatientRescheduleRequestController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Kiosk Touchscreen Route (Sprint 3)
Route::get('/kiosk', function () {
    return Inertia::render('Kiosk/Index');
})->name('kiosk');

Route::post('/api/check-in', [CheckInController::class, 'checkIn'])->name('api.check-in.web');

Route::get('/dashboard', function (Request $request) {
    $user = $request->user();
    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('patient.dashboard');
})->middleware(['auth'])->name('dashboard');

// Admin Routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
    
    // Real-Time Queue Monitor & Audit Logs (Sprint 5)
    Route::get('/queue', [AdminQueueController::class, 'index'])->name('queue.index');
    Route::post('/queue/{appointment}/mark-arrived', [AdminQueueController::class, 'markArrived'])->name('queue.mark-arrived');
    Route::post('/queue/{appointment}/trigger-noshow', [AdminQueueController::class, 'triggerNoShow'])->name('queue.trigger-noshow');

    // Patient Management
    Route::get('/patients/export-csv', [PatientController::class, 'exportCsv'])->name('patients.export');
    Route::post('/patients/import-csv', [PatientController::class, 'importCsv'])->name('patients.import');
    Route::post('/patients/{patient}/toggle-status', [PatientController::class, 'toggleStatus'])->name('patients.toggle-status');
    Route::resource('patients', PatientController::class);

    // Appointment Management (Sprint 2)
    Route::post('/appointments/{appointment}/cancel', [AdminAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/appointments/{appointment}/attach-medication', [AdminMedicationController::class, 'attachToAppointment'])->name('appointments.attach-medication');
    Route::delete('/appointments/{appointment}/detach-medication/{medication}', [AdminMedicationController::class, 'detachFromAppointment'])->name('appointments.detach-medication');
    Route::resource('appointments', AdminAppointmentController::class);

    // Reschedule Request Management (Sprint 4)
    Route::get('/reschedule-requests', [AdminRescheduleRequestController::class, 'index'])->name('reschedule-requests.index');
    Route::post('/reschedule-requests/{rescheduleRequest}/approve', [AdminRescheduleRequestController::class, 'approve'])->name('reschedule-requests.approve');
    Route::post('/reschedule-requests/{rescheduleRequest}/reject', [AdminRescheduleRequestController::class, 'reject'])->name('reschedule-requests.reject');

    // Announcements Management (Sprint 5)
    Route::post('/announcements/{announcement}/toggle-status', [AdminAnnouncementController::class, 'toggleStatus'])->name('announcements.toggle-status');
    Route::resource('announcements', AdminAnnouncementController::class)->except(['create', 'edit', 'show']);

    // Medications Management (Sprint 5)
    Route::resource('medications', AdminMedicationController::class)->except(['create', 'edit', 'show']);
});

// Patient Routes
Route::middleware(['auth', 'role:patient'])->prefix('patient')->name('patient.')->group(function () {
    Route::get('/dashboard', PatientDashboardController::class)->name('dashboard');

    // Patient Appointments (Sprint 2 & 4)
    Route::get('/appointments', [PatientAppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [PatientAppointmentController::class, 'store'])->name('appointments.store');
    Route::post('/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/reschedule', [PatientRescheduleRequestController::class, 'store'])->name('reschedule.store');

    // Clinic Announcements Feed (Sprint 5)
    Route::get('/announcements', [PatientAnnouncementController::class, 'index'])->name('announcements.index');
});

// Profile Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
