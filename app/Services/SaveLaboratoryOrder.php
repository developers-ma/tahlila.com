<?php

namespace App\Services;

use App\Models\{Test, Price};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\{Rule, ValidationException};

class SaveLaboratoryOrder
{
    public function save(Request $request, ?Test $test = null): Test
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'tests' => ['nullable', 'array', 'max:500'], 'tests.*' => ['string', 'max:100', 'distinct'],
            'modifieds' => ['nullable', 'array', 'max:500'],
            'modifieds.*' => ['integer', 'distinct', Rule::exists('test_for_patients', 'id')->where('test_id', $test?->id ?? 0)],
            'payment_method' => ['required', Rule::in(['cash', 'pos', 'banktransfer', 'cheque'])],
            'paid_amount' => ['required', 'numeric', 'min:0', 'max:999999999'],
            'test_status' => [$test ? 'sometimes' : 'required', Rule::in(['0', '1', '2', '3'])],
        ]);
        $selections = [];
        foreach ($data['tests'] ?? [] as $selection) {
            if (!preg_match('/^(\d+)\*(null|\d+)\*(null|\d+)$/', $selection, $parts)) {
                throw ValidationException::withMessages(['tests' => 'Sélection d’analyse invalide.']);
            }
            $price = Price::with(['groups', 'categories'])->find($parts[1]);
            if (!$price || ($parts[2] !== 'null' && !$price->groups->contains('id', $parts[2])) || ($parts[3] !== 'null' && !$price->categories->contains('id', $parts[3]))) {
                throw ValidationException::withMessages(['tests' => 'Une analyse ou son groupe a changé. Actualisez le catalogue.']);
            }
            $selections[] = ['price' => $price, 'group_id' => $parts[2] === 'null' ? null : $parts[2], 'category_id' => $parts[3] === 'null' ? null : $parts[3]];
        }
        $kept = $data['modifieds'] ?? [];
        if (!$selections && !$kept) throw ValidationException::withMessages(['tests' => 'Sélectionnez au moins une analyse.']);

        return DB::transaction(function () use ($test, $data, $selections, $kept) {
            $order = $test ? Test::lockForUpdate()->findOrFail($test->id) : new Test();
            $existing = $test ? DB::table('test_for_patients')->where('test_id', $test->id)->whereIn('id', $kept)->get() : collect();
            $prices = Price::whereIn('id', $existing->pluck('price_id'))->get()->keyBy('id');
            $unchanged = $test && !$selections && count($kept) === DB::table('test_for_patients')->where('test_id', $test->id)->count();
            // Preserve the recorded amount when only editing payment or status.
            $cents = $unchanged ? (int) round((float) $order->total_price * 100) : $existing->sum(fn ($line) => (int) round((float) ($prices[$line->price_id]->price ?? 0) * 100));
            foreach ($selections as $selection) $cents += (int) round((float) $selection['price']->price * 100);
            $paid = (int) round((float) $data['paid_amount'] * 100);
            $order->fill(collect($data)->except(['tests', 'modifieds'])->all());
            $order->total_price = $cents / 100;
            $order->paid_amount = $paid / 100;
            $order->remaining_or_give = ($cents - $paid) / 100;
            $order->save();
            if ($test) DB::table('test_for_patients')->where('test_id', $test->id)->whereNotIn('id', $kept)->delete();
            foreach ($selections as $selection) $order->prices()->attach($selection['price']->id, ['group_id' => $selection['group_id'], 'category_id' => $selection['category_id']]);
            return $order;
        });
    }
}
