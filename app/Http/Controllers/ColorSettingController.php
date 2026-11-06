<?php
namespace App\Http\Controllers;

use App\Models\ColorSetting;
use Illuminate\Http\Request;

class ColorSettingController extends Controller
{
// Store or update the color settings
public function update(Request $request)
{
    // Validate the incoming request
    $request->validate([
        'primary_color' => ['required', 'string', 'max:12', 'regex:/^#?[0-9a-fA-F]{3,8}$/'],
        'secondary_color' => ['required', 'string', 'max:12', 'regex:/^#?[0-9a-fA-F]{3,8}$/'],
        'tertiary_color' => 'required|string|max:12',
        'neutral_color' => 'required|string|max:12',
        'background_color' => 'required|string|max:12',
        'font_color' => 'required|string|max:12',
        'success_color' => 'required|string|max:12',
        'info_color' => 'required|string|max:12',
        'warning_color' => 'required|string|max:12',
        'error_color' => 'required|string|max:12',
    ]);


       // Update logic here
       $colors = ColorSetting::firstOrCreate([]);
       $colors->primary_color = $request->input('primary_color');
       $colors->secondary_color = $request->input('secondary_color');
       $colors->tertiary_color = $request->input('tertiary_color');
       $colors->neutral_color = $request->input('neutral_color');
       $colors->background_color = $request->input('background_color');
       $colors->font_color = $request->input('font_color');
       $colors->success_color = $request->input('success_color');
       $colors->info_color = $request->input('info_color');
       $colors->warning_color = $request->input('warning_color');
       $colors->error_color = $request->input('error_color');
       $colors->save();

    return redirect()->route('settings.colors.index')->with('success', 'Color settings updated successfully!');
}
}
