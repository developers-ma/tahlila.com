<?php

namespace Tests\Feature;

use App\Models\AnalysisGroup;
use App\Models\LaboratoryGroup;
use App\Models\LaboratoryPrice;
use App\Models\LaboratoryTest;
use App\Models\MedicalTest;
use App\Services\MedicalCatalogInstaller;
use Database\Seeders\MedicalCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MedicalCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seed_and_installation_are_idempotent(): void
    {
        $this->seed(MedicalCatalogSeeder::class);
        $this->seed(MedicalCatalogSeeder::class);
        $nfs = MedicalTest::where('code', 'NFS')->firstOrFail();
        $group = AnalysisGroup::where('code', 'NFS')->firstOrFail();
        $payload = ['installation_id' => (string) Str::uuid(), 'test_ids' => [$nfs->id], 'group_ids' => [$group->id], 'prices' => [$nfs->id => 80], 'group_prices' => [$group->id => 120], 'effective_from' => '2026-11-08'];

        $service = app(MedicalCatalogInstaller::class);
        $service->install($payload, null);
        $service->install($payload, null);

        $this->assertSame(1, LaboratoryTest::where('medical_test_id', $nfs->id)->count());
        $this->assertSame(1, LaboratoryGroup::where('analysis_group_id', $group->id)->count());
        $this->assertSame(2, LaboratoryPrice::count());
        $this->assertSame(21, $nfs->parameters()->count());
        $this->assertDatabaseHas('prices', ['medical_test_id'=>$nfs->id,'test_name'=>'Numération formule sanguine','price'=>80]);
        $this->assertDatabaseHas('categories', ['medical_category_id'=>$nfs->medical_category_id]);
        $this->assertDatabaseHas('groups', ['analysis_group_id'=>$group->id]);
    }

    public function test_default_ranges_are_sourced_and_require_biologist_validation(): void
    {
        $this->seed(MedicalCatalogSeeder::class);
        $this->assertDatabaseMissing('parameter_reference_ranges', ['source_citation' => null]);
        $this->assertDatabaseMissing('parameter_reference_ranges', ['validation_status' => 'validated']);
        $this->assertGreaterThan(0, \App\Models\ParameterReferenceRange::count());
    }
}
