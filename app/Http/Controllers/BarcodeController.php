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


class BarcodeController extends Controller
{
    //change status
    function update(Request $request, Test $test){
        $validated = $request->validate([
            'test_status' => 'required|in:0,1,2,3',
            'prelevement_date' => 'nullable|date',
      ]);
  
      $test->update($validated);

      if ($request->expectsJson()) {
          return response()->json([
              'message' => 'Prélèvement enregistré.',
              'test' => $test->fresh(['patient']),
          ]);
      }

      return redirect()->route('tests')->with('success', 'Test updated successfully.');

    }

    public function savePrintSettings(Request $request, Test $test)
    {
        $validated = $request->validate([
            'tube_copies' => ['required', 'array'],
            'tube_copies.*' => ['integer', 'min:0', 'max:100'],
            'tube_label_format' => ['required', 'in:50x25,50x30'],
        ]);

        $test->update($validated);

        return response()->json([
            'message' => 'Paramètres d’impression enregistrés.',
            'tube_copies' => $test->fresh()->tube_copies,
            'tube_label_format' => $test->fresh()->tube_label_format,
        ]);
    }
  
}
