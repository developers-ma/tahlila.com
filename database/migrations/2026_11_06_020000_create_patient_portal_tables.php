<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table): void {
            $table->boolean('patient_portal_enabled')->default(false)->after('default_language');
        });

        Schema::create('patient_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        Schema::create('patient_password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_password_reset_tokens');
        Schema::dropIfExists('patient_accounts');
        Schema::table('settings', function (Blueprint $table): void {
            $table->dropColumn('patient_portal_enabled');
        });
    }
};
