<?php

namespace App\Http\Controllers;

use App\Models\LaboratorySetting;


use Illuminate\Http\Request;

class LaboratorySettingController extends Controller
{
 
   // Method to handle the form submission (POST request)
   public function store(Request $request)
   {
       // Validate the incoming request
       $validated = $request->validate([
           'laboratory_name' => 'required|string|max:255',
           'managing_director' => 'required|string|max:255',
           'phone' => 'required|string|max:15',
           'fax' => 'nullable|string|max:15',
           'email' => 'required|email|max:255',
           'address' => 'required|string|max:255',
           'company_number' => 'required|string|max:15',
           'tax_id' => 'required|string|max:15',
           'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
           'footer_title1' => 'required|string|max:255',
           'footer_title2' => 'required|string|max:255',
           'footer_title3' => 'required|string|max:255',
       ]);

       $validated['fax'] = $validated['fax'] ?? '';
       if (!$request->hasFile('logo')) unset($validated['logo']);
       // Handle the logo upload
       if ($request->hasFile('logo')) {
           $logoPath = $request->file('logo')->store('logos', 'public');
           $validated['logo'] = $logoPath; // Store the logo path
       }

       // Update or create the laboratory settings (assuming there is only one record)
       LaboratorySetting::updateOrCreate(['id' => 1], $validated);

       // Redirect back to the settings page with a success message
       return redirect()->route('settings.laboratory')->with('success', 'Settings saved successfully!');
   }


}
