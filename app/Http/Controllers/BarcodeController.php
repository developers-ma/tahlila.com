<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Picqer\Barcode\BarcodeGeneratorSVG;

use App\Models\Patient;

use App\Models\Test;

use App\Models\Price;

use App\Models\Group;

use App\Models\Category;

use App\Models\Stock;


use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class BarcodeController extends Controller
{
    //change status
    function update(Request $request, Test $test){
        $validated = $request->validate([
            'test_status' => 'required|in:0,1,2,3',
            'prelevement_date' => 'nullable|date',
      ]);

      $storedCollectionDate = $test->prelevement_date?->toDateString();
      if ($storedCollectionDate && array_key_exists('prelevement_date', $validated)) {
          if (($validated['prelevement_date'] ?? '') !== $storedCollectionDate) {
              throw ValidationException::withMessages([
                  'prelevement_date' => 'La date du prélèvement est définitive après son enregistrement.',
              ]);
          }

          unset($validated['prelevement_date']);
      }
  
      $test->update($validated);

      if ($request->expectsJson()) {
          return response()->json([
              'message' => 'Prélèvement enregistré.',
              'test' => $test->fresh(['patient']),
          ]);
      }

      return redirect()->route('sample-collection')->with('success', 'Test updated successfully.');

    }

    public function savePrintSettings(Request $request, Test $test)
    {
        $validated = $request->validate([
            'tube_copies' => ['required', 'array'],
            'tube_copies.*' => ['integer', 'min:0', 'max:100'],
            'tube_label_format' => ['required', 'in:50x25,50x30'],
            'prelevement_date' => ['nullable', 'date'],
        ]);

        $storedCollectionDate = $test->prelevement_date?->toDateString();
        if ($storedCollectionDate) {
            if (
                array_key_exists('prelevement_date', $validated)
                && ($validated['prelevement_date'] ?? '') !== $storedCollectionDate
            ) {
                throw ValidationException::withMessages([
                    'prelevement_date' => 'La date du prélèvement est définitive après son enregistrement.',
                ]);
            }

            $validated['prelevement_date'] = $storedCollectionDate;
        } else {
            $validated['prelevement_date'] = $validated['prelevement_date']
                ?? now()->toDateString();
        }

        $test->update($validated);

        $test->refresh();

        return response()->json([
            'message' => 'Paramètres d’impression enregistrés.',
            'tube_copies' => $test->tube_copies,
            'tube_label_format' => $test->tube_label_format,
            'prelevement_date' => $test->prelevement_date?->toDateString(),
        ]);
    }
  
}
