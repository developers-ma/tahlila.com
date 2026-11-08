<?php
namespace App\Services;
use App\Models\{AnalysisGroup,CatalogInstallation,CatalogInstallationItem,CatalogVersion,Category,Group,LaboratoryGroup,LaboratoryPrice,LaboratoryTest,MedicalTest,Price};
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
            $summary=['groups'=>$groupIds->count(),'tests'=>$testIds->unique()->count(),'prices'=>collect($data['prices']??[])->filter(fn($v)=>$v!=='')->count()+collect($data['group_prices']??[])->filter(fn($v)=>$v!=='')->count()];
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
}
