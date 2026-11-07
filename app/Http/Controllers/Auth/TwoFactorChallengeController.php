<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use App\Services\TotpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorChallengeController extends Controller
{
    public function store(Request $request, TotpService $totp): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required', 'string']]);
        $user = User::find($request->session()->get('login.two_factor_user_id'));
        if (! $user || ! $user->two_factor_confirmed_at || ! $user->two_factor_secret) {
            return redirect('/login');
        }

        $valid = $totp->verify($user->two_factor_secret, $validated['code']);
        if (! $valid) {
            foreach ($user->two_factor_recovery_codes ?? [] as $index => $hash) {
                if (Hash::check(strtoupper(trim($validated['code'])), $hash)) {
                    $codes = $user->two_factor_recovery_codes;
                    unset($codes[$index]);
                    $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();
                    $valid = true;
                    break;
                }
            }
        }

        if (! $valid) {
            throw ValidationException::withMessages(['code' => 'Code incorrect ou expiré.']);
        }

        $remember = (bool) $request->session()->pull('login.remember', false);
        $request->session()->forget('login.two_factor_user_id');
        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(RouteServiceProvider::HOME);
    }
}
