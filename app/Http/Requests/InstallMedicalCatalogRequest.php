<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class InstallMedicalCatalogRequest extends FormRequest {
    public function authorize(): bool { return $this->user()?->hasPermission('catalog.manage') ?? false; }
    public function rules(): array { return ['installation_id'=>'required|uuid','test_ids'=>'array','test_ids.*'=>'integer|exists:medical_tests,id','group_ids'=>'array','group_ids.*'=>'integer|exists:analysis_groups,id','prices'=>'array','prices.*'=>'nullable|numeric|min:0|max:9999999.99','group_prices'=>'array','group_prices.*'=>'nullable|numeric|min:0|max:9999999.99','effective_from'=>'required|date']; }
}
