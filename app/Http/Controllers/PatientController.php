<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\PatientPortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    public function search(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100']);
        $search = $data['q'] ?? '';

        return Patient::where(fn ($q) => $q->where('firstname', 'like', '%'.$search.'%')->orWhere('lastname', 'like', '%'.$search.'%')->orWhere('id_card', 'like', '%'.$search.'%'))->orderBy('lastname')->limit(30)->get(['id', 'firstname', 'lastname', 'id_card']);
    }

    public function store(Request $request, PatientPortalService $portal)
    {
        $validated = $this->validatePatient($request);
        $patient = DB::transaction(function () use ($validated) {
            return Patient::create($this->prepareIdentity($validated));
        });
        $portal->syncPatient($patient);
        $id = $patient->id;

        return redirect('tests/create?patient='.$id)->with('success', 'Patient created successfully.');
    }

    public function update(Request $request, Patient $patient, PatientPortalService $portal)
    {
        $validated = $this->validatePatient($request, $patient);
        DB::transaction(function () use ($patient, $validated) {
            $patient->update($this->prepareIdentity($validated, $patient));
        });
        $portal->syncPatient($patient);

        return redirect()->route('patients.index')->with('success', 'Patient updated successfully.');
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();

        return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
    }

    private function validatePatient(Request $request, ?Patient $patient = null): array
    {
        $isChild = $request->boolean('is_child');

        return $request->validate([
            'gender' => ['required'],
            'id_card' => [Rule::requiredIf(! $isChild), 'nullable', 'string', 'max:255', Rule::unique('patients', 'id_card')->ignore($patient)],
            'parent_id_card' => [Rule::requiredIf($isChild), 'nullable', 'string', 'max:255'],
            'is_child' => ['nullable', 'boolean'],
            'has_insurance' => ['nullable', 'boolean'],
            'firstname' => ['required', 'string', 'max:255'],
            'lastname' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date'],
            'phone' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('patients', 'email')->ignore($patient)],
        ]);
    }

    private function prepareIdentity(array $validated, ?Patient $patient = null): array
    {
        $validated['has_insurance'] = (bool) ($validated['has_insurance'] ?? false);
        $validated['is_child'] = (bool) ($validated['is_child'] ?? false);

        if (! $validated['is_child']) {
            $validated['id_card'] = trim((string) $validated['id_card']);
            $validated['parent_id_card'] = null;
            $validated['child_number'] = null;

            return $validated;
        }

        $parentId = trim((string) $validated['parent_id_card']);
        if (
            $patient?->is_child
            && strcasecmp((string) $patient->parent_id_card, $parentId) === 0
            && $patient->child_number
        ) {
            $childNumber = $patient->child_number;
        } else {
            $childNumber = ((int) Patient::where('parent_id_card', $parentId)->max('child_number')) + 1;
        }

        $generatedId = "child/{$childNumber}/{$parentId}";
        while (Patient::where('id_card', $generatedId)->when($patient, fn ($query) => $query->whereKeyNot($patient->id))->exists()) {
            $childNumber++;
            $generatedId = "child/{$childNumber}/{$parentId}";
        }

        $validated['parent_id_card'] = $parentId;
        $validated['child_number'] = $childNumber;
        $validated['id_card'] = $generatedId;

        return $validated;
    }
}
