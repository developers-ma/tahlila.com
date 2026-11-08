<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AnalysisGroup extends Model { protected $guarded=[]; protected $casts=['is_active'=>'boolean']; public function category(){return $this->belongsTo(MedicalCategory::class,'medical_category_id');} public function tests(){return $this->belongsToMany(MedicalTest::class,'group_test_items')->withPivot('sort_order')->withTimestamps();} public function laboratoryGroup(){return $this->hasOne(LaboratoryGroup::class);} }
