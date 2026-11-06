<?php
namespace App\Http\Controllers;

use App\Models\EmailSetting;
use Illuminate\Http\Request;

class EmailSettingController extends Controller
{
    // Store or update the email settings
    public function store(Request $request)
    {
        // Validate the incoming data
        $request->validate([
            'mail_host' => 'required|string',
            'mail_port' => 'required|string',
            'mail_username' => 'required|string',
            'mail_password' => 'nullable|string',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string',
        ]);

        // Check if settings exist, if not, create them
        $emailSetting = EmailSetting::firstOrNew([]);

        // Update or create email settings
        $emailSetting->fill([
            'mail_driver' => 'smtp', // Default value
            'mail_host' => $request->mail_host,
            'mail_port' => $request->mail_port,
            'mail_username' => $request->mail_username,
            'mail_password' => $request->filled('mail_password') ? $request->mail_password : $emailSetting->mail_password,
            'mail_encryption' => $request->mail_encryption ?? null,
            'mail_from_address' => $request->mail_from_address,
            'mail_from_name' => $request->mail_from_name,
            'email_notification' => $request->boolean('send_email') ? 'true' : 'false',
        ]);

        // Save the settings
        $emailSetting->save();

        // Return success message
        return redirect()->route('settings.email')->with('success', 'Email settings saved successfully');
    }
}
