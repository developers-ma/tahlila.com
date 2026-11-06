<?php

namespace Tests\Feature;

use Tests\TestCase;

class TranslationCoverageTest extends TestCase
{
    public function test_arabic_covers_every_registered_interface_message(): void
    {
        $messages = json_decode(file_get_contents(resource_path('js/lims/messages.json')), true, flags: JSON_THROW_ON_ERROR);
        $arabic = json_decode(file_get_contents(base_path('lang/ar.json')), true, flags: JSON_THROW_ON_ERROR);
        $supplement = json_decode(file_get_contents(resource_path('js/lims/ar-messages.json')), true, flags: JSON_THROW_ON_ERROR);
        $catalogue = array_replace($supplement, $arabic);

        $missing = collect(array_unique(array_values($messages)))
            ->reject(fn (string $key) => isset($catalogue[$key]) && trim((string) $catalogue[$key]) !== '')
            ->values()
            ->all();

        $this->assertSame([], $missing, 'Missing Arabic translations: '.implode(', ', $missing));
    }

    public function test_every_installed_language_has_direction_and_name_metadata(): void
    {
        foreach (glob(base_path('lang/*.json')) as $path) {
            $dictionary = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $this->assertContains($dictionary['dir'] ?? null, ['ltr', 'rtl'], basename($path).' has no valid direction.');
            $this->assertNotEmpty($dictionary['Language Name'] ?? null, basename($path).' has no language name.');
        }
    }
}
