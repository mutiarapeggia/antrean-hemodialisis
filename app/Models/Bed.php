<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bed extends Model
{
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_OCCUPIED = 'occupied';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_DAMAGED = 'damaged';

    protected $fillable = [
        'bed_number',
        'label',
        'status',
        'notes',
    ];

    /**
     * Scope query to only include beds with status 'available'.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    /**
     * Scope query to only include beds available for patient booking/allocation.
     * Excludes beds marked as maintenance or damaged.
     */
    public function scopeAvailableForBooking($query)
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    public function isUsable(): bool
    {
        return !in_array($this->status, [self::STATUS_MAINTENANCE, self::STATUS_DAMAGED], true);
    }
}
