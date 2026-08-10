<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('medication_id')->constrained('medications')->cascadeOnDelete();
            $table->string('dosage_given')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['appointment_id', 'medication_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_medications');
    }
};
