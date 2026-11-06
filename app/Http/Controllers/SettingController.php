<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PaymentMethod; // Assuming your model name is paymentMethod

class SettingController extends Controller
{
    
    public function payment(Request $request)
    {
        $request->validate([
            'cash' => 'nullable',
            'pos' => 'nullable',
            'bank_transfer' => 'nullable',
            'cheque' => 'nullable',
            'currency' => 'nullable|string|max:10',
            'tax' => 'nullable|numeric|min:0|max:100',
        ]);

        $paymentMethod = PaymentMethod::firstOrCreate([]);

        if ($paymentMethod) {
            $paymentMethod->update([
                'cash' => $request->boolean('cash') ? 'true' : 'false',
                'pos' => $request->boolean('pos') ? 'true' : 'false',
                'bank_transfer' => $request->boolean('bank_transfer') ? 'true' : 'false',
                'cheque' => $request->boolean('cheque') ? 'true' : 'false',
                'currency' => $request->currency,
                'tax' => $request->tax,
            ]);

            return redirect()->route('settings.payment')->with('success', 'Payment settings updated successfully');
        }

        return redirect()->route('settings.payment')->with('success', 'Payment settings updated successfully');
    }
}
