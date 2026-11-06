<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Result;

use App\Models\Test;

use App\Models\Patient;

use App\Models\Price;

use App\Models\Group;

use App\Models\Category;

use Illuminate\Support\Facades\DB;


class ResultController extends Controller
{
        public function revision(Request $request)
        {
            $validatedData = $request->validate([
                'result' => '',
            ]);
        
            Result::create($validatedData);
        
            return redirect('/results')->with('success', 'Result has been added');
        }


        public function store(Request $request)
        {
            $validatedData = $request->validate([
                'result' => '',
            ]);
        
            Result::create($validatedData);
        
            return redirect('/dashboard')->with('success', 'Result has been added');
        }
        
        
        
        
        //store results in table test_for_patients
        public function update(Request $request, Result $results)
        {
            $validatedData = $request->validate([
                'test_result_value' => 'nullable|string|max:2000',
                'test_result_value_2' => 'nullable|string|max:2000',
                'patient_age' => 'nullable|numeric|min:0',
                'patient_weight' => 'nullable|numeric|min:0',
                'patient_height' => 'nullable|numeric|min:0',
                'conclusion' => 'nullable|string|max:20000',

            ]);
        
            $results->update($validatedData);
        
            return redirect('/tests/'.$results->test_id)->with('success', 'Résultat enregistré.');
        }
        
        public function destroy(Result $results)
        {
            $results->delete();
        
            return redirect('/results')->with('success', 'Result has been deleted');
        }
}
