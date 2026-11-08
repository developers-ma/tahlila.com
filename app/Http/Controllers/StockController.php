<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Stock;



class StockController extends Controller
{
    //store product in stock
    function store(Request $request){

        $validated = $request->validate([
            'product_name' => 'required',
            'product_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'track_inventory' => 'sometimes|boolean',
            'quantity' => 'nullable|required_if:track_inventory,1|numeric|min:0',
        ]);
        $validated['track_inventory'] = $request->has('track_inventory') ? $request->boolean('track_inventory') : true;
        if (!$validated['track_inventory']) $validated['quantity'] = null;
        Stock::create($validated);
        return redirect()->route('stocks')->with('success', 'Product created successfully.');

    }

    //update prolducts
    function update(Request $request, Stock $product){
        $validated = $request->validate([
            'product_name' => 'required',
            'product_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'track_inventory' => 'sometimes|boolean',
            'quantity' => 'nullable|required_if:track_inventory,1|numeric|min:0',
            'quantity_used' => 'nullable|numeric|min:0',
        ]);
        $validated['track_inventory'] = $request->has('track_inventory') ? $request->boolean('track_inventory') : $product->track_inventory;
        if (!$validated['track_inventory']) unset($validated['quantity'], $validated['quantity_used']);
        $product->update($validated);
        return redirect()->route('stocks')->with('success', 'Product updated successfully.');
    }


   // delete products
        public function destroy(Stock $product)
    {
        $product->delete();
        return redirect()->route('stocks')->with('success', 'Product deleted successfully.');
    }


}
