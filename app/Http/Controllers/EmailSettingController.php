<?php

namespace App\Http\Controllers;

use App\Models\EmailSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmailSettingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $settings = EmailSetting::firstOrNew([]);
        $validated = $request->validate([
            'mail_host' => ['required', 'string', 'max:255'],
            'mail_port' => ['required', 'integer', 'between:1,65535'],
            'mail_username' => ['required', 'string', 'max:255'],
            'mail_password' => [Rule::requiredIf(blank($settings->mail_password) || $settings->mail_password === 'your_password'), 'nullable', 'string', 'max:2048'],
            'mail_encryption' => ['nullable', 'in:tls,ssl'],
            'mail_from_address' => ['required', 'email', 'max:255'],
            'mail_from_name' => ['required', 'string', 'max:255'],
            'imap_host' => ['required', 'string', 'max:255'],
            'imap_port' => ['required', 'integer', 'between:1,65535'],
            'imap_username' => ['required', 'string', 'max:255'],
            'imap_password' => [Rule::requiredIf(blank($settings->imap_password)), 'nullable', 'string', 'max:2048'],
            'imap_encryption' => ['required', 'in:tls,ssl,none'],
            'imap_validate_cert' => ['nullable', 'boolean'],
        ]);

        $settings->fill([...$validated, ...[
            'mail_driver' => 'smtp',
            'mail_password' => $request->filled('mail_password') ? $request->string('mail_password')->toString() : $settings->mail_password,
            'imap_password' => $request->filled('imap_password') ? $request->string('imap_password')->toString() : $settings->imap_password,
            'imap_validate_cert' => $request->boolean('imap_validate_cert'),
            'email_notification' => $request->boolean('send_email') ? 'true' : 'false',
        ]]);
        $settings->save();

        return redirect()->route('settings.email')->with('success', 'Configuration de la messagerie enregistrée.');
    }
}
