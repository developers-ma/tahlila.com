<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\PatientPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PatientPortalSettingController extends Controller
{
    public function update(Request $request, PatientPortalService $portal): RedirectResponse
    {
        // Normalize HTML checkbox values (0/1, true/false, on/off) before validation.
        $request->merge(['patient_portal_enabled' => $request->boolean('patient_portal_enabled')]);
        $validated = $request->validate(['patient_portal_enabled' => ['required', 'boolean']]);
        $setting = Setting::firstOrCreate([], ['default_language' => 'fr']);
        $setting->update(['patient_portal_enabled' => $validated['patient_portal_enabled']]);

        $synced = $setting->patient_portal_enabled ? $portal->syncAll() : 0;
        $message = $setting->patient_portal_enabled
            ? "L’espace patient est actif. {$synced} compte(s) avec e-mail unique sont prêts."
            : 'L’espace patient est désactivé.';

        return redirect('/setting/patient-portal')->with('success', $message);
    }
}
