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
            'quantity' => 'required',
        ]);
        Stock::create($validated);
        return redirect()->route('stocks')->with('success', 'Product created successfully.');

    }

    //update prolducts
    function update(Request $request, Stock $product){
        $validated = $request->validate([
            'product_name' => 'required',
            'product_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'quantity' => '',
            'quantity_used' => '',
        ]);
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
