<?php

namespace Tests\Feature;

use App\Models\AnalysisGroup;
use App\Models\LaboratoryGroup;
use App\Models\LaboratoryPrice;
use App\Models\LaboratoryTest;
use App\Models\MedicalTest;
use App\Models\CollectionTube;
use App\Models\Stock;
use App\Models\TestMaterialRequirement;
use App\Services\CollectionMaterialCalculatorService;
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

    public function test_installation_creates_materials_once_and_preserves_customized_associations(): void
    {
        $this->seed(MedicalCatalogSeeder::class);
        $nfs=MedicalTest::where('code','NFS')->firstOrFail();
        $service=app(MedicalCatalogInstaller::class);
        $payload=['installation_id'=>(string)Str::uuid(),'test_ids'=>[$nfs->id],'group_ids'=>[],'prices'=>[],'group_prices'=>[],'effective_from'=>'2026-11-08','install_materials'=>true,'associate_materials'=>true];
        $first=$service->install($payload,null);
        $requirement=TestMaterialRequirement::where('medical_test_id',$nfs->id)->firstOrFail();
        $requirement->update(['collection_instructions'=>'Protocole local validé','is_customized'=>true]);
        $materialCount=CollectionTube::count();
        $stockCount=Stock::count();

        $second=$service->install([...$payload,'installation_id'=>(string)Str::uuid()],null);

        $this->assertSame($materialCount,CollectionTube::count());
        $this->assertSame($stockCount,Stock::count());
        $this->assertFalse((bool)$requirement->material->stock->track_inventory);
        $this->assertSame('Protocole local validé',$requirement->fresh()->collection_instructions);
        $this->assertNotSame($first->id,$second->id);
        $this->assertSame(1,TestMaterialRequirement::where('medical_test_id',$nfs->id)->count());
    }

    public function test_calculator_groups_only_validated_shareable_requirements(): void
    {
        $this->seed(MedicalCatalogSeeder::class);
        $tests=MedicalTest::whereIn('code',['NFS','HBA1C'])->get();
        $edta=CollectionTube::where('code','EDTA')->firstOrFail();
        foreach($tests as $test) TestMaterialRequirement::create(['medical_test_id'=>$test->id,'collection_tube_id'=>$edta->id,'role'=>'primary','preference'=>1,'quantity'=>1,'shareable'=>true,'validation_status'=>'validated']);

        $plan=app(CollectionMaterialCalculatorService::class)->calculate($tests->pluck('id'));

        $this->assertSame(1,$plan['total']);
        $this->assertCount(1,$plan['items']);
        $this->assertCount(2,$plan['items'][0]['analyses']);
        $this->assertSame([],$plan['missing_configuration']);
    }
}
