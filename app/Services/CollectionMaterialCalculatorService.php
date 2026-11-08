<?php
namespace App\Services;

use App\Models\MedicalTest;
use Illuminate\Support\Collection;

class CollectionMaterialCalculatorService
{
    /** Calculate a conservative collection plan. Only explicitly shareable,
     * validated requirements are grouped; unknown rules stay visible. */
    public function calculate(iterable $medicalTestIds): array
    {
        $tests=MedicalTest::with(['materialRequirements.material.stock'])->whereKey($medicalTestIds)->get();
        $missing=[]; $groups=[];
        foreach($tests as $test){
            $requirement=$test->materialRequirements->sortBy('preference')->first();
            if(!$requirement){ $missing[]=['medical_test_id'=>$test->id,'code'=>$test->code,'name'=>$test->name]; continue; }
            $canShare=$requirement->shareable && $requirement->validation_status==='validated';
            $key=$requirement->collection_tube_id.($canShare?':shared':':'.$test->id);
            if(!isset($groups[$key])) $groups[$key]=['material'=>$requirement->material,'quantity'=>0,'analyses'=>[],'minimum_volume_ml'=>0,'validated'=>$requirement->validation_status==='validated'];
            $groups[$key]['quantity']=$canShare ? max(1,$groups[$key]['quantity']) : $groups[$key]['quantity']+max(1,(int)($requirement->quantity??1));
            $groups[$key]['analyses'][]=['id'=>$test->id,'code'=>$test->code,'name'=>$test->name];
            if($requirement->minimum_volume_ml!==null) $groups[$key]['minimum_volume_ml']+=(float)$requirement->minimum_volume_ml;
        }
        $items=collect($groups)->values()->map(function($row){
            $capacity=(float)($row['material']->capacity_ml??0);
            if($capacity>0 && $row['minimum_volume_ml']>0) $row['quantity']=max($row['quantity'],(int)ceil($row['minimum_volume_ml']/$capacity));
            $row['material']=$row['material']->toArray();
            return $row;
        })->all();
        return ['items'=>$items,'total'=>collect($items)->sum('quantity'),'missing_configuration'=>$missing];
    }
}
