<?php
namespace App\Services;
use App\Models\{AnalysisGroup,CatalogInstallation,CatalogInstallationItem,CatalogVersion,Category,CollectionTube,Group,LaboratoryGroup,LaboratoryPrice,LaboratoryTest,MedicalTest,Price,Stock,TestMaterialRequirement};
use Illuminate\Support\Facades\DB;
use Throwable;
class MedicalCatalogInstaller {
    public function install(array $data, ?int $userId): CatalogInstallation {
        $existing=CatalogInstallation::find($data['installation_id']);
        if ($existing?->status==='completed') return $existing;
        $version=CatalogVersion::latest('id')->firstOrFail();
        $installation=CatalogInstallation::updateOrCreate(['id'=>$data['installation_id']],['catalog_version_id'=>$version->id,'status'=>'processing','installed_by'=>$userId,'error_message'=>null]);
        try { DB::transaction(function() use($data,$installation,$userId){
            $testIds=collect($data['test_ids']??[])->map(fn($id)=>(int)$id)->unique(); $groupIds=collect($data['group_ids']??[])->map(fn($id)=>(int)$id)->unique();
            foreach(AnalysisGroup::with('tests:id')->whereKey($groupIds)->get() as $group){ $local=LaboratoryGroup::updateOrCreate(['analysis_group_id'=>$group->id],['is_active'=>true]); Group::updateOrCreate(['analysis_group_id'=>$group->id],['group_name'=>$group->name]); $this->item($installation,'group',$group->id); $testIds=$testIds->merge($group->tests->pluck('id')); if(isset($data['group_prices'][$group->id])&&$data['group_prices'][$group->id]!=='') $this->price($local,$data['group_prices'][$group->id],$data['effective_from'],$userId); }
            foreach(MedicalTest::with(['category','groups','parameters.referenceRanges'])->whereKey($testIds->unique())->get() as $test){ $local=LaboratoryTest::updateOrCreate(['medical_test_id'=>$test->id],['is_active'=>true]); $this->syncLegacyTest($test,$data['prices'][$test->id]??null); $this->item($installation,'test',$test->id); if(isset($data['prices'][$test->id])&&$data['prices'][$test->id]!=='') $this->price($local,$data['prices'][$test->id],$data['effective_from'],$userId); }
            $materials = ($data['install_materials'] ?? true) ? $this->installMaterials($testIds->unique(), (bool)($data['associate_materials'] ?? true), $installation) : ['created'=>0,'reused'=>0,'associations_created'=>0,'associations_preserved'=>0,'to_verify'=>0];
            $summary=['categories'=>MedicalTest::whereKey($testIds->unique())->distinct()->count('medical_category_id'),'groups'=>$groupIds->count(),'tests'=>$testIds->unique()->count(),'prices'=>collect($data['prices']??[])->filter(fn($v)=>$v!=='')->count()+collect($data['group_prices']??[])->filter(fn($v)=>$v!=='')->count(),'materials'=>$materials];
            $installation->update(['status'=>'completed','summary'=>$summary,'completed_at'=>now()]);
        }); } catch(Throwable $e){ $installation->update(['status'=>'failed','error_message'=>$e->getMessage()]); throw $e; }
        return $installation->fresh('items');
    }
    private function item($installation,string $type,int $id): void { CatalogInstallationItem::updateOrCreate(['catalog_installation_id'=>$installation->id,'item_type'=>$type,'item_id'=>$id],['status'=>'installed']); }
    private function price($model,$amount,string $date,?int $userId): void { LaboratoryPrice::updateOrCreate(['priceable_type'=>$model::class,'priceable_id'=>$model->id,'convention'=>null,'effective_from'=>$date],['amount'=>$amount,'currency'=>'MAD','is_active'=>true,'created_by'=>$userId]); }
    private function syncLegacyTest(MedicalTest $test,mixed $amount): void {
        $category=Category::updateOrCreate(['medical_category_id'=>$test->medical_category_id],['category_name'=>$test->category->name]);
        $parameter=$test->parameters->first();
        $references=$test->parameters->flatMap->referenceRanges->map(function($range){
            $sex=$range->sex==='all'?'':ucfirst($range->sex).' : ';
            return $sex.($range->lower_bound!==null?$range->lower_bound.' – '.$range->upper_bound.' '.$range->unit:($range->qualitative_value??'À vérifier'));
        })->unique()->implode(' | ');
        $price=Price::updateOrCreate(['medical_test_id'=>$test->id],[
            'test_name'=>$test->name,'test_description'=>$test->description?:('Code '.$test->code),
            'test_unit'=>$parameter?->unit?:$test->unit?:'—','test_reference_value'=>$references?:'À vérifier par le biologiste',
            'test_required_age'=>'false','test_required_weight'=>'false','test_required_height'=>'false','test_requiring_conclusion'=>'false',
            'price'=>$amount!==null&&$amount!==''?$amount:0,
        ]);
        $price->categories()->syncWithoutDetaching([$category->id]);
        foreach($test->groups as $medicalGroup){ $group=Group::updateOrCreate(['analysis_group_id'=>$medicalGroup->id],['group_name'=>$medicalGroup->name]); $price->groups()->syncWithoutDetaching([$group->id]); }
    }
    private function installMaterials($testIds, bool $associate, CatalogInstallation $installation): array {
        $created=0; $reused=0; $associationsCreated=0; $preserved=0; $toVerify=0;
        foreach($this->materialCatalog() as $code=>$row){
            $material=CollectionTube::where('code',$code)->first();
            if($material){
                $reused++;
                foreach(collect($row)->except(['product_name']) as $field=>$value) if($material->{$field}===null && $value!==null) $material->{$field}=$value;
                $material->save();
            }
            else { $material=CollectionTube::create(['code'=>$code]+collect($row)->except(['product_name'])->all()); $created++; }
            if(!$material->stock_id){
                $stock=Stock::firstOrCreate(['product_name'=>$row['product_name']],['product_color'=>$row['color_hex'] ?: '#64748B','track_inventory'=>false,'quantity'=>null,'quantity_used'=>null]);
                $material->update(['stock_id'=>$stock->id]);
            }
            $this->item($installation,'material',$material->id);
        }
        if($associate) foreach(MedicalTest::whereKey($testIds)->whereNotNull('collection_tube_id')->get() as $test){
            $existing=TestMaterialRequirement::where('medical_test_id',$test->id)->where('collection_tube_id',$test->collection_tube_id)->first();
            if($existing){ $preserved++; continue; }
            TestMaterialRequirement::create(['medical_test_id'=>$test->id,'collection_tube_id'=>$test->collection_tube_id,'role'=>'primary','preference'=>1,'quantity'=>1,'shareable'=>in_array($test->collectionTube?->code,['EDTA','SERUM','CITRATE']),'validation_status'=>'to_verify']);
            $associationsCreated++; $toVerify++;
        }
        return compact('created','reused','associationsCreated','preserved','toVerify')+['associations_created'=>$associationsCreated,'associations_preserved'=>$preserved,'to_verify'=>$toVerify];
    }
    private function materialCatalog(): array { return [
        'PLAIN'=>['name'=>'Tube sec','name_en'=>'Plain tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Rouge','color'=>'Rouge','color_hex'=>'#DC2626','additive'=>null,'compatible_specimen'=>'Sérum','product_name'=>'Tube sec'],
        'SERUM'=>['name'=>'Tube sec avec gel séparateur','name_en'=>'Serum separator tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Jaune','color'=>'Jaune','color_hex'=>'#EAB308','additive'=>'Activateur de coagulation + gel','compatible_specimen'=>'Sérum','product_name'=>'Tube SST'],
        'HEPARIN'=>['name'=>'Tube hépariné','name_en'=>'Heparin tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Vert','color'=>'Vert','color_hex'=>'#16A34A','additive'=>'Héparine','compatible_specimen'=>'Plasma','product_name'=>'Tube hépariné'],
        'CITRATE'=>['name'=>'Tube citrate','name_en'=>'Citrate tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Bleu clair','color'=>'Bleu clair','color_hex'=>'#38BDF8','additive'=>'Citrate de sodium','compatible_specimen'=>'Plasma citraté','product_name'=>'Tube citrate'],
        'EDTA'=>['name'=>'Tube EDTA','name_en'=>'EDTA tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Mauve','color'=>'Mauve','color_hex'=>'#A855F7','additive'=>'K2/K3 EDTA','compatible_specimen'=>'Sang total','product_name'=>'Tube EDTA'],
        'FLUORIDE'=>['name'=>'Tube fluoré','name_en'=>'Fluoride tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Gris','color'=>'Gris','color_hex'=>'#94A3B8','additive'=>'Fluorure/oxalate','compatible_specimen'=>'Plasma','product_name'=>'Tube fluoré'],
        'ESR'=>['name'=>'Tube VS','name_en'=>'ESR tube','category'=>'tube','physical_form'=>'tube','cap_color'=>'Noir','color'=>'Noir','color_hex'=>'#171717','additive'=>'Citrate de sodium','compatible_specimen'=>'Sang total','product_name'=>'Tube VS'],
        'URINE'=>['name'=>'Flacon de prélèvement urinaire','name_en'=>'Urine container','category'=>'container','physical_form'=>'flacon','cap_color'=>null,'color'=>'Transparent','color_hex'=>'#CBD5E1','additive'=>null,'compatible_specimen'=>'Urines','product_name'=>'Flacon urinaire'],
        'FALCON'=>['name'=>'Tube Falcon','name_en'=>'Falcon tube','category'=>'container','physical_form'=>'tube conique','cap_color'=>'Bleu','color'=>'Bleu','color_hex'=>'#2563EB','additive'=>null,'compatible_specimen'=>'Prélèvements biologiques','product_name'=>'Tube Falcon'],
        'STOOL'=>['name'=>'Pot stérile pour selles','name_en'=>'Sterile stool container','category'=>'container','physical_form'=>'pot','cap_color'=>null,'color'=>'Transparent','color_hex'=>'#CBD5E1','additive'=>null,'compatible_specimen'=>'Selles','product_name'=>'Pot stérile selles'],
        'BLOOD_CULTURE'=>['name'=>'Flacon d’hémoculture','name_en'=>'Blood culture bottle','category'=>'bottle','physical_form'=>'flacon','cap_color'=>null,'color'=>'Variable','color_hex'=>'#64748B','additive'=>'Milieu de culture','compatible_specimen'=>'Sang','product_name'=>'Flacon hémoculture'],
        'SWAB'=>['name'=>'Écouvillon avec ou sans milieu de transport','name_en'=>'Transport swab','category'=>'swab','physical_form'=>'écouvillon','cap_color'=>null,'color'=>'Blanc','color_hex'=>'#F8FAFC','additive'=>'Selon variante','compatible_specimen'=>'Écouvillonnage','product_name'=>'Écouvillon'],
        'SLIDE'=>['name'=>'Lame de microscope','name_en'=>'Microscope slide','category'=>'slide','physical_form'=>'lame','cap_color'=>null,'color'=>'Transparent','color_hex'=>'#E2E8F0','additive'=>null,'compatible_specimen'=>'Prélèvements biologiques','product_name'=>'Lame microscope'],
    ]; }
}
