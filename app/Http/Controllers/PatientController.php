<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\PatientPortalService;
use Illuminate\Http\Request;
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
        $validated = $request->validate([
            'gender' => 'required',
            'id_card' => 'required',
            'firstname' => 'required',
            'lastname' => 'required',
            'date_of_birth' => 'required',
            'phone' => 'required',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('patients', 'email')],
        ]);
        $patient = Patient::create($validated);
        $portal->syncPatient($patient);
        $id = $patient->id;

        return redirect('tests/create?patient='.$id)->with('success', 'Patient created successfully.');
    }

    public function update(Request $request, Patient $patient, PatientPortalService $portal)
    {
        $validated = $request->validate([
            'gender' => 'required',
            'id_card' => 'required',
            'firstname' => 'required',
            'lastname' => 'required',
            'date_of_birth' => 'required',
            'phone' => 'required',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('patients', 'email')->ignore($patient)],
        ]);

        $patient->update($validated);
        $portal->syncPatient($patient);

        return redirect()->route('patients.index')->with('success', 'Patient updated successfully.');
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();

        return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
    }
}
