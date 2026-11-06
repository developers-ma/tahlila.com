<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Patient;

use App\Models\Test;

use App\Models\Price;

use App\Models\Group;

use App\Models\Category;

use App\Models\PaymentMethod;

use App\Models\Stock;

use Illuminate\Support\Facades\DB;

use PDF;

use Picqer\Barcode\BarcodeGeneratorSVG;

class InvoiceController extends Controller
{
    //changeremainingorgiving
    function changeremainingorgiving(Request $request, Test $test){
        $validated = $request->validate([
            'remaining_or_give' => 'required|numeric|max:999999999',
      ]);
  
      if ((float) $validated['remaining_or_give'] > (float) $test->total_price) {
          throw \Illuminate\Validation\ValidationException::withMessages(['remaining_or_give' => 'Le solde ne peut pas dépasser le total du dossier.']);
      }
      $validated['paid_amount'] = round((float) $test->total_price - (float) $validated['remaining_or_give'], 2);
      $test->update($validated);
      return redirect()->route('invoices')->with('success', 'invoice updated successfully.');

    }
}
