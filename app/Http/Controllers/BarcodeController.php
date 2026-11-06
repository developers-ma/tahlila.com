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
      return redirect()->route('tests')->with('success', 'Test updated successfully.');

    }
  
}
