<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_settings', function (Blueprint $table): void {
            $table->string('imap_host')->nullable()->after('mail_encryption');
            $table->unsignedSmallInteger('imap_port')->default(993)->after('imap_host');
            $table->string('imap_encryption')->default('ssl')->after('imap_port');
            $table->string('imap_username')->nullable()->after('imap_encryption');
            $table->text('imap_password')->nullable()->after('imap_username');
            $table->boolean('imap_validate_cert')->default(true)->after('imap_password');
        });
    }

    public function down(): void
    {
        Schema::table('email_settings', function (Blueprint $table): void {
            $table->dropColumn(['imap_host', 'imap_port', 'imap_encryption', 'imap_username', 'imap_password', 'imap_validate_cert']);
        });
    }
};
