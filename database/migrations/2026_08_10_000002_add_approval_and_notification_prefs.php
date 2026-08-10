<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('approval_status')->default('approved'); // pending | approved | rejected
            $table->text('rejection_reason')->nullable();
            $table->string('notification_preference')->default('both'); // email | whatsapp | both
            $table->string('whatsapp_number')->nullable();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('approval_status')->default('approved'); // pending_approval | approved | rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['approval_status', 'rejection_reason', 'notification_preference', 'whatsapp_number']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['approval_status', 'approved_by']);
        });
    }
};
