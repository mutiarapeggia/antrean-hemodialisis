<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('shift'); // pagi | siang
            $table->string('status')->default('scheduled'); // scheduled | checked-in | in-progress | completed | no-show
            $table->string('qr_token')->unique();
            $table->boolean('is_recurring')->default(false);
            $table->boolean('emergency_override')->default(false);
            $table->timestamps();

            $table->index(['appointment_date', 'shift', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
