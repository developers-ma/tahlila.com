<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class LanguageController extends Controller
{
    public function activate(string $lang)
    {
        abort_unless($this->languageExists($lang), 404);
        DB::table('settings')->update(['default_language' => $lang]);

        return response()->json(['message' => "Language '$lang' activated successfully."]);
    }

    public function update(Request $request, string $lang)
    {
        abort_unless($this->languageExists($lang), 404);
        $validated = $request->validate([
            'translations' => ['required', 'array'],
            'translations.*' => ['nullable', 'string', 'max:10000'],
            'dir' => ['required', 'in:ltr,rtl'],
        ]);

        $translations = ['dir' => $validated['dir']];
        foreach ($validated['translations'] as $key => $value) {
            if ($key !== 'dir') $translations[$key] = $value;
        }

        File::put(
            base_path("lang/$lang.json"),
            json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );

        return response()->json(['message' => "Translations for '$lang' updated successfully."]);
    }

    private function languageExists(string $lang): bool
    {
        return preg_match('/^[a-zA-Z-]+$/', $lang) === 1
            && File::exists(base_path("lang/$lang.json"));
    }
}
