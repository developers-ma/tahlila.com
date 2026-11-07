<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Patient;

use App\Models\Test;

use App\Models\Price;

use App\Models\Group;

use App\Models\Category;


use Illuminate\Support\Facades\DB;


class TestController extends Controller
{
    //change status in all barcodes
    function changestatus(Request $request, Test $test){
        $validated = $request->validate([
            'test_status' => 'required|in:0,1,2,3',
      ]);
  
      $test->update($validated);

      if ($request->input('return_to') === 'results') {
          return redirect('/results')->with('success', 'Status updated successfully.');
      }

      return redirect()->route('sample-collection')->with('success', 'Status updated successfully.');

    }

    public function store(Request $request)
    {
        $test = app(\App\Services\SaveLaboratoryOrder::class)->save($request);
        return redirect('invoice/'.$test->id)->with('success', 'Dossier enregistré.');
    }

    public function update(Request $request, Test $test)
    {
        app(\App\Services\SaveLaboratoryOrder::class)->save($request, $test);
        return redirect()->route('sample-collection')->with('success', 'Dossier mis à jour.');
    }

    public function destroy(Test $test)
{
    $test->delete();
    return redirect()->route('sample-collection')->with('success', 'Test deleted successfully.');
}

public function destroytest(Test $test)
{
    $test->delete();
    return redirect()->route('sample-collection')->with('success', 'Test deleted successfully.');
}
    

}
