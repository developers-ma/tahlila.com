<?php

namespace App\Http\Controllers;

use App\Mail\TestResultReady;
use App\Models\EmailSetting;
use App\Models\LaboratorySetting;
use App\Models\Test;
use App\Services\MailboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class EmailController extends Controller
{
    public function downloadReport(Test $test): Response
    {
        $test->load(['patient']);
        $lines = DB::table('test_for_patients as lines')
            ->leftJoin('prices', 'prices.id', '=', 'lines.price_id')
            ->leftJoin('groups', 'groups.id', '=', 'lines.group_id')
            ->leftJoin('categories', 'categories.id', '=', 'lines.category_id')
            ->where('lines.test_id', $test->id)
            ->select('prices.*', 'lines.*', 'groups.group_name', 'categories.category_name')
            ->get();
        $pdf = Pdf::loadView('reports.result-pdf', [
            'test' => $test,
            'lines' => $lines,
            'laboratory' => LaboratorySetting::first(),
        ])->setPaper('a4');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="rapport-'.$test->id.'.pdf"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function sendReportEmail(Request $request, Test $test): JsonResponse
    {
        $validated = $request->validate([
            'to' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:100000'],
        ]);

        $settings = EmailSetting::first();
        if ($settings?->email_notification !== 'true') {
            return response()->json(['success' => false, 'message' => 'Les notifications par e-mail sont désactivées.'], 422);
        }

        try {
            $test->load(['patient', 'prices.groups', 'prices.categories']);
            $lines = DB::table('test_for_patients as lines')
                ->leftJoin('prices', 'prices.id', '=', 'lines.price_id')
                ->leftJoin('groups', 'groups.id', '=', 'lines.group_id')
                ->leftJoin('categories', 'categories.id', '=', 'lines.category_id')
                ->where('lines.test_id', $test->id)
                ->select('prices.*', 'lines.*', 'groups.group_name', 'categories.category_name')
                ->get();
            $pdf = Pdf::loadView('reports.result-pdf', [
                'test' => $test,
                'lines' => $lines,
                'laboratory' => LaboratorySetting::first(),
            ])->setPaper('a4');

            Mail::html('<div style="font-family:Arial,sans-serif;line-height:1.6">'.nl2br(e($validated['message'])).'</div>', function ($mail) use ($validated, $pdf, $test): void {
                $mail->to($validated['to'])->subject($validated['subject']);
                $mail->attachData($pdf->output(), 'rapport-'.$test->id.'.pdf', ['mime' => 'application/pdf']);
            });

            return response()->json(['success' => true, 'message' => 'Rapport envoyé avec succès.']);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['success' => false, 'message' => 'Envoi impossible. Vérifiez la configuration SMTP.'], 502);
        }
    }
    public function sendTestResultEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|max:255']);
        $settings = EmailSetting::first();
        if ($settings?->email_notification !== 'true') {
            return response()->json(['success' => false, 'message' => 'Les notifications par e-mail sont désactivées.']);
        }

        try {
            Mail::to($request->email)->send(new TestResultReady($request->email));

            return response()->json(['success' => true]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['success' => false, 'message' => 'Envoi impossible. Vérifiez la configuration SMTP.'], 502);
        }
    }

    public function sendEmail(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'to' => ['required', 'string', 'max:2000'],
            'cc' => ['nullable', 'string', 'max:2000'],
            'bcc' => ['nullable', 'string', 'max:2000'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:100000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240'],
            'reply_message_id' => ['nullable', 'string', 'max:998'],
        ]);

        $to = $this->recipients($validated['to'], 'to');
        $cc = $this->recipients($validated['cc'] ?? '', 'cc');
        $bcc = $this->recipients($validated['bcc'] ?? '', 'bcc');
        $html = '<div style="font-family:Arial,sans-serif;line-height:1.6">'.nl2br(e($validated['message'])).'</div>';

        try {
            Mail::html($html, function ($mail) use ($request, $validated, $to, $cc, $bcc): void {
                $mail->to($to)->subject($validated['subject']);
                if ($cc !== []) {
                    $mail->cc($cc);
                }
                if ($bcc !== []) {
                    $mail->bcc($bcc);
                }
                foreach ($request->file('attachments', []) as $attachment) {
                    $mail->attach($attachment->getRealPath(), [
                        'as' => $attachment->getClientOriginalName(),
                        'mime' => $attachment->getMimeType(),
                    ]);
                }
                if (! empty($validated['reply_message_id'])) {
                    $headers = $mail->getSymfonyMessage()->getHeaders();
                    $headers->addTextHeader('In-Reply-To', $validated['reply_message_id']);
                    $headers->addTextHeader('References', $validated['reply_message_id']);
                }
            });

            return redirect('/email')->with('success', 'Message envoyé avec succès.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->withInput()->with('error', 'Envoi impossible. Vérifiez la configuration SMTP.');
        }
    }

    public function flag(Request $request, int $uid): RedirectResponse
    {
        $validated = $request->validate([
            'folder' => ['required', 'string', 'max:500'],
            'action' => ['required', 'in:star,unstar,read,unread,delete'],
        ]);
        $this->mailbox()->flag($uid, $validated['folder'], $validated['action']);

        return redirect('/email?'.http_build_query(['folder' => $validated['folder']]))->with('success', 'Message mis à jour.');
    }

    public function attachment(Request $request, int $uid, string $part): Response|BinaryFileResponse
    {
        $folder = $request->string('folder', 'INBOX')->toString();
        $attachment = $this->mailbox()->attachment($uid, $part, $folder);

        return response($attachment['content'], 200, [
            'Content-Type' => $attachment['mime'],
            'Content-Disposition' => 'attachment; filename="'.addslashes(basename($attachment['name'])).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function recipients(string $value, string $field): array
    {
        $addresses = collect(preg_split('/[,;]+/', $value))->map(fn (string $email) => trim($email))->filter()->values()->all();
        foreach ($addresses as $index => $email) {
            if (Validator::make(['email' => $email], ['email' => ['required', 'email:rfc']])->fails()) {
                throw ValidationException::withMessages([$field => "Adresse e-mail invalide : {$email}"]);
            }
        }

        return $addresses;
    }

    private function mailbox(): MailboxService
    {
        $settings = EmailSetting::firstOrFail();

        return MailboxService::fromSettings($settings);
    }
}
