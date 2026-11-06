<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         // Create the email_settings table
         Schema::create('email_settings', function (Blueprint $table) {
            $table->id();
            $table->string('mail_driver')->default('smtp');
            $table->string('mail_host');
            $table->string('mail_port');
            $table->string('mail_username');
            $table->string('mail_password');
            $table->string('mail_encryption')->nullable();
            $table->string('mail_from_address');
            $table->string('mail_from_name');
            $table->string('email_notification');
            $table->timestamps();
        });

        // Insert default SMTP data into the table
        DB::table('email_settings')->insert([
            'mail_driver' => 'smtp',
            'mail_host' => 'live.smtp.mailtrap.io',  // Example SMTP host
            'mail_port' => '587',
            'mail_username' => 'your_username',
            'mail_password' => 'your_password',
            'mail_encryption' => 'tls',
            'mail_from_address' => 'hello@demomailtrap.com',
            'mail_from_name' => env('APP_NAME', 'Your App Name'),
            'email_notification' => 'true',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_settings');
    }
};