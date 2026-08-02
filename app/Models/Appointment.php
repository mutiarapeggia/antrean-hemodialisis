<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
    ];

    protected $casts = [
        'appointment_date' => 'date',
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
        $payload = "APP-PATIENT-{$patientId}-DATE-{$date}-SHIFT-{$shift}-BED-" . ($bedNumber ?? 'default');
        return hash_hmac('sha256', $payload, config('app.key', 'secret-key'));
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
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
}
