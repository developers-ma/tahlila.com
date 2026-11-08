<?php
namespace App\Http\Controllers;
use App\Http\Requests\InstallMedicalCatalogRequest;
use App\Models\{CatalogInstallation,MedicalCategory,MedicalTest,ParameterReferenceRange};
use App\Services\MedicalCatalogInstaller;
use Illuminate\Http\Request;
class MedicalCatalogController extends Controller {
    public function data(Request $request){
        $categories=MedicalCategory::with(['groups.tests:id,medical_category_id,code,name,abbreviation,specimen_type_id','tests.specimenType:id,name','tests.parameters:id,medical_test_id'])->orderBy('sort_order')->get();
        return response()->json(['categories'=>$categories,'installedTestIds'=>\App\Models\LaboratoryTest::where('is_active',true)->pluck('medical_test_id'),'installedGroupIds'=>\App\Models\LaboratoryGroup::where('is_active',true)->pluck('analysis_group_id'),'pendingReferences'=>ParameterReferenceRange::where('validation_status','to_verify')->count(),'lastInstallation'=>CatalogInstallation::latest()->first()]);
    }
    public function install(InstallMedicalCatalogRequest $request,MedicalCatalogInstaller $installer){ return response()->json($installer->install($request->validated(),$request->user()->id)); }
}
