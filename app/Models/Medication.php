<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'name',
        'dosage',
        'frequency',
        'notes',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointments(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Appointment::class, 'appointment_medications')
            ->withPivot(['dosage_given', 'notes'])
            ->withTimestamps();
    }
}
