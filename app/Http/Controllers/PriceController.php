<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Price;

use App\Models\Category;

use App\Models\Group;

use Illuminate\Support\Facades\DB;


class PriceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'test_name' => 'required',
            'categories' => 'array',
            'categories.*' => 'integer|exists:categories,id',
            'groups' => 'array',
            'groups.*' => 'integer|exists:groups,id',
            'test_description' => 'required',
            'test_unit' => 'required',
            'test_reference_value' => 'required',
            'test_unit_2' => '',
            'test_reference_value_2' => '',
            'price' => 'required|numeric',
        ]);
    
        // Create a new Price instance
        $price = Price::create(array_merge(
            collect($validated)->except(['categories', 'groups'])->all(),
            [
                'test_required_age' => $request->boolean('test_required_age') ? 'true' : 'false',
                'test_required_weight' => $request->boolean('test_required_weight') ? 'true' : 'false',
                'test_required_height' => $request->boolean('test_required_height') ? 'true' : 'false',
                'test_requiring_conclusion' => $request->boolean('test_requiring_conclusion') ? 'true' : 'false',
            ],
        ));
        
    
        // Attach the selected categories
        $price->categories()->attach($request->input('categories', []));
    
        // Attach the selected groups
        $price->groups()->attach($request->input('groups', []));
    
        return redirect()->route('prices')
                         ->with('success', 'Price created successfully.');
    }
    

    public function update(Request $request, Price $price)
    {
        $validated = $request->validate([
            'test_name' => 'required',
            'categories' => 'array',
            'categories.*' => 'integer|exists:categories,id',
            'groups' => 'array',
            'groups.*' => 'integer|exists:groups,id',
            'test_description' => 'required',
            'test_unit' => 'required',
            'test_reference_value' => 'required',
            'test_unit_2' => '',
            'test_reference_value_2' => '',
            'price' => 'required|numeric',
        ]);

          // check if checkbox is checked
          $validated['test_required_age'] = $request->boolean('test_required_age') ? 'true' : 'false';
          $validated['test_required_weight'] = $request->boolean('test_required_weight') ? 'true' : 'false';
          $validated['test_required_height'] = $request->boolean('test_required_height') ? 'true' : 'false';
          $validated['test_requiring_conclusion'] = $request->boolean('test_requiring_conclusion') ? 'true' : 'false';
    
        // Update the inputs fields
        $price->update(collect($validated)->except(['categories', 'groups'])->all());
    
        // Sync the selected categories
        $price->categories()->sync($request->input('categories', []));
    
        // Sync the selected groups
        $price->groups()->sync($request->input('groups', []));
    
        return redirect()->route('prices')
                         ->with('success', 'Price updated successfully.');
    }
    

    public function destroy(Price $price)
    {
        if (DB::table('test_for_patients')->where('price_id', $price->id)->exists()) {
            return back()->with('error', 'Cette analyse appartient à un dossier. Conservez-la pour préserver ses résultats.');
        }
        $price->categories()->detach();
        $price->groups()->detach();
        $price->delete();

        return redirect()->route('prices')
                         ->with('success', 'Price deleted successfully');
    }
}
