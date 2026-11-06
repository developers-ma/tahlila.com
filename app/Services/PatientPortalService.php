<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\PatientAccount;
use App\Models\Setting;

class PatientPortalService
{
    public function enabled(): bool
    {
        return (bool) Setting::query()->value('patient_portal_enabled');
    }

    public function syncPatient(Patient $patient): ?PatientAccount
    {
        $email = mb_strtolower(trim((string) $patient->email));
        if (! $this->enabled()) {
            return null;
        }
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $patient->account()->update(['active' => false]);

            return null;
        }
        if (Patient::whereRaw('LOWER(email) = ?', [$email])->whereKeyNot($patient->id)->exists()) {
            $patient->account()->update(['active' => false]);

            return null;
        }

        $emailOwner = PatientAccount::where('email', $email)->where('patient_id', '!=', $patient->id)->exists();
        if ($emailOwner) {
            $patient->account()->update(['active' => false]);

            return null;
        }

        return PatientAccount::updateOrCreate(
            ['patient_id' => $patient->id],
            ['email' => $email, 'active' => true],
        );
    }

    public function syncAll(): int
    {
        PatientAccount::query()->update(['active' => false]);

        return Patient::whereNotNull('email')->get()->sum(
            fn (Patient $patient) => $this->syncPatient($patient) ? 1 : 0,
        );
    }
}
