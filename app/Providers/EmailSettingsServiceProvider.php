<?php
namespace App\Providers;

use App\Models\EmailSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class EmailSettingsServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        try {
            if (! Schema::hasTable('email_settings')) {
                return;
            }

            $emailSettings = EmailSetting::first();
        } catch (\Throwable) {
            // The application must still boot before the database is configured or migrated.
            return;
        }

        if ($emailSettings) {
            // Override the mail configuration from the database
            Config::set('mail.mailers.smtp.host', $emailSettings->mail_host);
            Config::set('mail.mailers.smtp.port', $emailSettings->mail_port);
            Config::set('mail.mailers.smtp.encryption', $emailSettings->mail_encryption);
            Config::set('mail.mailers.smtp.username', $emailSettings->mail_username);
            Config::set('mail.mailers.smtp.password', $emailSettings->mail_password);

             // Override from email settings
             Config::set('mail.from.address', $emailSettings->mail_from_address);
             Config::set('mail.from.name', $emailSettings->mail_from_name);
        } else {
            // Fallback to .env settings if database settings are not found
            Config::set('mail.mailers.smtp.host', env('MAIL_HOST'));
            Config::set('mail.mailers.smtp.port', env('MAIL_PORT'));
            Config::set('mail.mailers.smtp.encryption', env('MAIL_ENCRYPTION'));
            Config::set('mail.mailers.smtp.username', env('MAIL_USERNAME'));
            Config::set('mail.mailers.smtp.password', env('MAIL_PASSWORD'));

            // Fallback to .env MAIL_FROM settings
            Config::set('mail.from.address', env('MAIL_FROM_ADDRESS', 'hello@demomailtrap.com'));
            Config::set('mail.from.name', env('MAIL_FROM_NAME', env('APP_NAME', 'Your App')));
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
