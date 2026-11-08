<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Price;

use App\Models\Category;

use App\Models\Group;

use Illuminate\Support\Facades\DB;
use App\Models\TestMaterialRequirement;


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
            'materials' => 'array',
            'materials.*' => 'integer|exists:collection_tubes,id',
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
        $this->syncMaterials($price, $request);
    
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
            'materials' => 'array',
            'materials.*' => 'integer|exists:collection_tubes,id',
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
        $this->syncMaterials($price, $request);
    
        return redirect()->route('prices')
                         ->with('success', 'Price updated successfully.');
    }

    private function syncMaterials(Price $price, Request $request): void
    {
        if (!$price->medical_test_id) return;
        $ids=collect($request->input('materials', []))->map(fn($id)=>(int)$id)->unique()->values();
        TestMaterialRequirement::where('medical_test_id',$price->medical_test_id)->whereNotIn('collection_tube_id',$ids)->delete();
        foreach($ids as $index=>$id) TestMaterialRequirement::updateOrCreate(
            ['medical_test_id'=>$price->medical_test_id,'collection_tube_id'=>$id],
            ['role'=>$index===0?'primary':'alternative','preference'=>$index+1,'quantity'=>1,'shareable'=>false,'validation_status'=>'to_verify','is_customized'=>true]
        );
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
