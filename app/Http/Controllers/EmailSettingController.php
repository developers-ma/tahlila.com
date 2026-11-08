<?php

namespace App\Http\Controllers;

use App\Models\EmailSetting;
use App\Models\LaboratorySetting;
use App\Services\EmailConfigurationDiscoveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmailSettingController extends Controller
{
    public function automatic(Request $request, EmailConfigurationDiscoveryService $discovery): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('settings.manage') || $request->user()?->hasPermission('email.send'), 403);
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'max:2048'],
            'from_name' => ['nullable', 'string', 'max:255'],
            'redirect' => ['nullable', Rule::in(['/email', '/setting/email'])],
        ]);
        $configuration = $discovery->discover($validated['email']);
        $settings = EmailSetting::firstOrNew([]);
        $settings->fill([
            'mail_driver' => 'smtp',
            'mail_host' => $configuration['smtpHost'],
            'mail_port' => $configuration['smtpPort'],
            'mail_encryption' => $configuration['smtpEncryption'],
            'mail_username' => $validated['email'],
            'mail_password' => $validated['password'],
            'mail_from_address' => $validated['email'],
            'mail_from_name' => $validated['from_name'] ?: LaboratorySetting::value('laboratory_name') ?: str($validated['email'])->before('@')->headline()->toString(),
            'imap_host' => $configuration['imapHost'],
            'imap_port' => $configuration['imapPort'],
            'imap_encryption' => $configuration['imapEncryption'],
            'imap_username' => $validated['email'],
            'imap_password' => $validated['password'],
            'imap_validate_cert' => true,
            'email_notification' => 'true',
        ])->save();

        return response()->json([
            'message' => 'Messagerie configurée.',
            'provider' => $configuration['provider'],
            'suggested' => $configuration['suggested'],
            'smtp' => $configuration['smtpHost'].':'.$configuration['smtpPort'],
            'imap' => $configuration['imapHost'].':'.$configuration['imapPort'],
            'redirect' => $validated['redirect'] ?? '/email',
        ]);
    }

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
