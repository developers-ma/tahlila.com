<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientAccount;
use App\Notifications\PatientPortalResetPassword;
use App\Services\PatientPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class PatientPortalAuthController extends Controller
{
    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $email = mb_strtolower(trim($validated['email']));
        $key = 'patient-login:'.$request->ip().':'.$email;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['email' => 'Trop de tentatives. Réessayez dans une minute.']);
        }

        $account = PatientAccount::where('email', $email)->where('active', true)->first();
        if (! $account?->password || ! Hash::check($validated['password'], $account->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => 'Adresse e-mail ou mot de passe incorrect.']);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put('patient_account_id', $account->id);
        $account->update(['last_login_at' => now()]);

        return redirect('/patient/dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('patient_account_id');
        $request->session()->regenerateToken();

        return redirect('/patient/login')->with('success', 'Vous êtes déconnecté en toute sécurité.');
    }

    public function requestReset(Request $request, PatientPortalService $portal): RedirectResponse
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $email = mb_strtolower(trim($validated['email']));
        $key = 'patient-reset:'.$request->ip().':'.$email;

        if (! RateLimiter::tooManyAttempts($key, 3)) {
            RateLimiter::hit($key, 60);
            $account = PatientAccount::where('email', $email)->first();
            if (! $account) {
                $patients = Patient::whereRaw('LOWER(email) = ?', [$email])->get();
                if ($patients->count() === 1) {
                    $account = $portal->syncPatient($patients->first());
                }
            }

            if ($account?->active) {
                $token = Str::random(64);
                DB::table('patient_password_reset_tokens')->updateOrInsert(
                    ['email' => $email],
                    ['token' => Hash::make($token), 'created_at' => now()],
                );
                try {
                    $account->loadMissing('patient')->notify(new PatientPortalResetPassword($token));
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        }

        return redirect('/patient/forgot-password')->with('success', 'Si cette adresse correspond à un patient autorisé, un lien sécurisé vient d’être envoyé.');
    }

    public function reset(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        $email = mb_strtolower(trim($validated['email']));
        $reset = DB::table('patient_password_reset_tokens')->where('email', $email)->first();

        if (! $reset || now()->diffInMinutes($reset->created_at, true) > 60 || ! Hash::check($validated['token'], $reset->token)) {
            throw ValidationException::withMessages(['email' => 'Ce lien est invalide ou a expiré. Demandez un nouveau lien.']);
        }

        $account = PatientAccount::where('email', $email)->where('active', true)->firstOrFail();
        $account->update(['password' => $validated['password']]);
        DB::table('patient_password_reset_tokens')->where('email', $email)->delete();
        $request->session()->regenerate();
        $request->session()->put('patient_account_id', $account->id);

        return redirect('/patient/dashboard')->with('success', 'Votre mot de passe a été enregistré.');
    }
}
