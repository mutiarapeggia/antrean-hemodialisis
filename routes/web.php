<?php

use App\Http\Controllers\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\BedController as AdminBedController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PatientController;
use App\Http\Controllers\Admin\QueueController as AdminQueueController;
use App\Http\Controllers\Admin\RescheduleRequestController as AdminRescheduleRequestController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BedInformationController;
use App\Http\Controllers\Patient\AnnouncementController as PatientAnnouncementController;
use App\Http\Controllers\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\Patient\DashboardController as PatientDashboardController;
use App\Http\Controllers\Patient\RescheduleRequestController as PatientRescheduleRequestController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Root redirect to /kiosk
Route::get('/', function () {
    return redirect()->route('kiosk');
});

// 2. Kiosk Touchscreen Route (Public)
Route::get('/kiosk', function () {
    return Inertia::render('Kiosk/Index');
})->name('kiosk');

// 2b. Public Realtime Bed Information Display
Route::get('/informasi-bed', [BedInformationController::class, 'index'])->name('bed-information');

// 3. Monitor Antrean TV / Live Display (Public)
Route::get('/monitor', [AdminQueueController::class, 'monitorDisplay'])->name('monitor');

// 4. API Check-In Web
Route::post('/api/check-in', [CheckInController::class, 'checkIn'])->name('api.check-in.web');

// 5. Patient Public Routes
Route::get('/pasien/login', function () {
    return redirect('/login?as=pasien');
});

Route::get('/pasien/daftar', [RegisteredUserController::class, 'create'])->name('patient.register');

// 6. Generic Dashboard Dispatcher
Route::get('/dashboard', function (Request $request) {
    $user = $request->user();
    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('patient.dashboard');
})->middleware(['auth'])->name('dashboard');

// 7. Admin Protected Routes (/admin)
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::get('/dashboard', fn() => redirect()->route('admin.dashboard'));
    
    // Real-Time Queue Monitor & Audit Logs
    Route::get('/queue', [AdminQueueController::class, 'index'])->name('queue.index');
    Route::post('/queue/{appointment}/mark-arrived', [AdminQueueController::class, 'markArrived'])->name('queue.mark-arrived');
    Route::post('/queue/{appointment}/trigger-noshow', [AdminQueueController::class, 'triggerNoShow'])->name('queue.trigger-noshow');
    Route::post('/queue/{appointment}/start-treatment', [AdminQueueController::class, 'startTreatment'])->name('queue.start-treatment');
    Route::post('/queue/{appointment}/complete-treatment', [AdminQueueController::class, 'completeTreatment'])->name('queue.complete-treatment');
    Route::post('/queue/{appointment}/restore-noshow', [AdminQueueController::class, 'restoreNoShow'])->name('queue.restore-noshow');

    // Patient Management
    Route::get('/patients/export-csv', [PatientController::class, 'exportCsv'])->name('patients.export');
    Route::post('/patients/import-csv', [PatientController::class, 'importCsv'])->name('patients.import');
    Route::post('/patients/{patient}/toggle-status', [PatientController::class, 'toggleStatus'])->name('patients.toggle-status');
    Route::resource('patients', PatientController::class);

    // Master Bed Management
    Route::resource('beds', AdminBedController::class);

    // Appointment Management
    Route::post('/appointments/{appointment}/cancel', [AdminAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::resource('appointments', AdminAppointmentController::class);

    // Reschedule Request Management
    Route::get('/reschedule-requests', [AdminRescheduleRequestController::class, 'index'])->name('reschedule-requests.index');
    Route::post('/reschedule-requests/{rescheduleRequest}/approve', [AdminRescheduleRequestController::class, 'approve'])->name('reschedule-requests.approve');
    Route::post('/reschedule-requests/{rescheduleRequest}/reject', [AdminRescheduleRequestController::class, 'reject'])->name('reschedule-requests.reject');



    // Appointment Approvals & Emergency Override
    Route::get('/appointment-approvals', [\App\Http\Controllers\Admin\AppointmentApprovalController::class, 'index'])->name('appointment-approvals.index');
    Route::post('/appointment-approvals/{appointment}/approve', [\App\Http\Controllers\Admin\AppointmentApprovalController::class, 'approve'])->name('appointment-approvals.approve');
    Route::post('/appointment-approvals/{appointment}/reject', [\App\Http\Controllers\Admin\AppointmentApprovalController::class, 'reject'])->name('appointment-approvals.reject');
    Route::post('/appointment-approvals/emergency-override', [\App\Http\Controllers\Admin\AppointmentApprovalController::class, 'emergencyOverride'])->name('appointment-approvals.emergency-override');

    // Announcements Management
    Route::post('/announcements/{announcement}/toggle-status', [AdminAnnouncementController::class, 'toggleStatus'])->name('announcements.toggle-status');
    Route::resource('announcements', AdminAnnouncementController::class)->except(['create', 'edit', 'show']);
});

// 8. Patient Protected Routes (/pasien)
Route::middleware(['auth', 'role:patient'])->prefix('pasien')->name('patient.')->group(function () {
    Route::get('/', PatientDashboardController::class)->name('dashboard');
    Route::get('/dashboard', fn() => redirect()->route('patient.dashboard'));

    // Patient Appointments
    Route::get('/appointments', [PatientAppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [PatientAppointmentController::class, 'store'])->name('appointments.store');
    Route::post('/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/reschedule', [PatientRescheduleRequestController::class, 'store'])->name('reschedule.store');

    // Clinic Announcements Feed
    Route::get('/announcements', [PatientAnnouncementController::class, 'index'])->name('announcements.index');

    // Interactive Notifications & Preferences
    Route::get('/notifications', [\App\Http\Controllers\Patient\NotificationPreferenceController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/preferences', [\App\Http\Controllers\Patient\NotificationPreferenceController::class, 'update'])->name('notifications.update');
});

// 9. Profile Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// 10. Fallback Route -> Redirect to /kiosk
Route::fallback(function () {
    return redirect()->route('kiosk');
});
