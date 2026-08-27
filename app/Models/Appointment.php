<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'admin_id',
        'appointment_date',
        'start_time',
        'end_time',
        'shift',
        'bed_number',
        'status',
        'qr_token',
        'is_recurring',
        'emergency_override',
        'cancellation_reason',
        'approval_status',
        'approved_by',
    ];

    protected $casts = [
        'appointment_date' => 'date:Y-m-d',
        'is_recurring' => 'boolean',
        'emergency_override' => 'boolean',
    ];

    // Status enum constants
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_CHECKED_IN = 'checked-in';
    public const STATUS_IN_PROGRESS = 'in-progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_NO_SHOW = 'no-show';
    public const STATUS_CANCELLED = 'cancelled';

    // Shift constants
    public const SHIFT_PAGI = 'pagi';
    public const SHIFT_SIANG = 'siang';

    public static function getShiftTimes(string $shift): array
    {
        if ($shift === self::SHIFT_PAGI) {
            return ['start_time' => '07:00:00', 'end_time' => '11:00:00'];
        }
        return ['start_time' => '12:00:00', 'end_time' => '16:00:00'];
    }

    public static function generateHmacQrToken($patientId, $date, $shift, $bedNumber = null): string
    {
        do {
            $microtime = microtime(true);
            $randomStr = Str::random(10);
            $payload = "APP-PATIENT-{$patientId}-DATE-{$date}-SHIFT-{$shift}-BED-" . ($bedNumber ?? 'default') . "-TIME-{$microtime}-RAND-{$randomStr}";
            $token = hash_hmac('sha256', $payload, config('app.key', 'secret-key'));
        } while (self::where('qr_token', $token)->exists());

        return $token;
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class);
    }

    public function rescheduleRequests(): HasMany
    {
        return $this->hasMany(RescheduleRequest::class);
    }

    public function latestRescheduleRequest(): HasOne
    {
        return $this->hasOne(RescheduleRequest::class)->latestOfMany();
    }

    /**
     * Auto-relocate any existing regular patient occupying target bed to an available free bed when emergency override occurs.
     */
    public static function relocateRegularPatientIfOccupied(string $dateStr, string $shift, string $targetBed, int $excludeAppointmentId = 0): ?string
    {
        $targetBedStr = trim(str_replace('Bed', '', $targetBed));

        // Find active non-cancelled, non-emergency regular appointment occupying $targetBed
        $existingApp = self::with(['patient.user'])
            ->whereDate('appointment_date', $dateStr)
            ->where('shift', $shift)
            ->where(function ($q) use ($targetBedStr) {
                $q->where('bed_number', $targetBedStr)
                  ->orWhere('bed_number', "Bed {$targetBedStr}");
            })
            ->whereIn('status', [
                self::STATUS_SCHEDULED,
                self::STATUS_CHECKED_IN,
                self::STATUS_IN_PROGRESS,
            ])
            ->where('id', '!=', $excludeAppointmentId)
            ->where(function ($q) {
                $q->where('emergency_override', false)
                  ->orWhereNull('emergency_override');
            })
            ->first();

        if (!$existingApp) {
            return null; // No regular patient to relocate
        }

        // Get all occupied bed numbers for this date and shift
        $occupiedBeds = self::whereDate('appointment_date', $dateStr)
            ->where('shift', $shift)
            ->whereIn('status', [
                self::STATUS_SCHEDULED,
                self::STATUS_CHECKED_IN,
                self::STATUS_IN_PROGRESS,
            ])
            ->pluck('bed_number')
            ->map(fn($b) => trim(str_replace('Bed', '', $b)))
            ->toArray();

        // Find first free bed from 1 to 10
        $freeBed = null;
        for ($b = 1; $b <= 10; $b++) {
            $bedStr = (string) $b;
            if (!in_array($bedStr, $occupiedBeds)) {
                $freeBed = $bedStr;
                break;
            }
        }

        if ($freeBed) {
            $oldBed = $existingApp->bed_number;

            $newQrToken = self::generateHmacQrToken(
                $existingApp->patient_id,
                $dateStr,
                $shift,
                $freeBed
            );

            $existingApp->update([
                'bed_number' => $freeBed,
                'qr_token' => $newQrToken,
            ]);

            $patientName = $existingApp->patient->user->name ?? 'Pasien Reguler';

            AuditLog::create([
                'user_id' => auth()->id() ?? $existingApp->admin_id,
                'action' => 'EMERGENCY_OVERRIDE_RELOCATED',
                'description' => "Relokasi Otomatis: Pasien reguler {$patientName} dipindahkan dari Bed #{$oldBed} ke Bed #{$freeBed} karena alokasi darurat medis.",
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'created_at' => now(),
            ]);

            return $freeBed;
        }

        return null;
    }
}
