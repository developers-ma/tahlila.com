<?php

namespace App\Http\Controllers;

use App\Services\TotpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TwoFactorAuthenticationController extends Controller
{
    public function enable(Request $request, TotpService $totp): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $secret = $totp->generateSecret();
        $codes = collect(range(1, 8))->map(fn () => Str::upper(Str::random(5).'-'.Str::random(5)))->all();
        $request->user()->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => array_map(fn ($code) => Hash::make($code), $codes),
            'two_factor_confirmed_at' => null,
        ])->save();
        $request->session()->put('two_factor_plain_recovery_codes', $codes);

        return back()->with('success', 'Scannez le QR code puis confirmez le code à 6 chiffres.');
    }

    public function confirm(Request $request, TotpService $totp): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();
        if (! $user->two_factor_secret || ! $totp->verify($user->two_factor_secret, $validated['code'])) {
            throw ValidationException::withMessages(['code' => 'Le code d’authentification est invalide.']);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        $codes = $request->session()->pull('two_factor_plain_recovery_codes', []);

        return back()->with('success', 'Authentification à deux facteurs activée.')
            ->with('two_factor_recovery_codes', $codes);
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
        $request->session()->forget('two_factor_plain_recovery_codes');

        return back()->with('success', 'Authentification à deux facteurs désactivée.');
    }

    public function regenerate(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);
        abort_unless($request->user()->two_factor_confirmed_at, 409);
        $codes = collect(range(1, 8))->map(fn () => Str::upper(Str::random(5).'-'.Str::random(5)))->all();
        $request->user()->forceFill([
            'two_factor_recovery_codes' => array_map(fn ($code) => Hash::make($code), $codes),
        ])->save();

        return back()->with('success', 'Nouveaux codes de récupération générés.')
            ->with('two_factor_recovery_codes', $codes);
    }
}
