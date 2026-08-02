<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'bed_number')) {
                $table->string('bed_number')->nullable()->after('shift');
            }
            if (!Schema::hasColumn('appointments', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('emergency_override');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'bed_number')) {
                $table->dropColumn('bed_number');
            }
            if (Schema::hasColumn('appointments', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }
        });
    }
};
