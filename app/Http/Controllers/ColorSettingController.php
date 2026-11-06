<?php

namespace App\Http\Controllers;

use App\Models\ColorSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ColorSettingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $colors = $request->validate(
            collect(ColorSetting::DEFAULTS)->mapWithKeys(
                fn (string $value, string $field) => [$field => ['required', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/']],
            )->all(),
        );

        ColorSetting::firstOrCreate([])->update($colors);

        return redirect()->route('settings.colors.index')->with('success', 'Les couleurs ont été enregistrées.');
    }

    public function reset(): RedirectResponse
    {
        ColorSetting::firstOrCreate([])->update(ColorSetting::DEFAULTS);

        return redirect()->route('settings.colors.index')->with('success', 'Les couleurs par défaut ont été restaurées.');
    }
}
