<?php

namespace App\Http\Middleware;

use App\Models\PatientAccount;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticatePatientPortal
{
    public function handle(Request $request, Closure $next): Response
    {
        $account = PatientAccount::with('patient')->find($request->session()->get('patient_account_id'));

        if (! $account?->active) {
            $request->session()->forget('patient_account_id');
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/patient/login');
        }

        $request->attributes->set('patientAccount', $account);

        return $next($request);
    }
}
