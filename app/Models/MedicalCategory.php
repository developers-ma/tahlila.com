<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class MedicalCategory extends Model { protected $guarded=[]; protected $casts=['is_active'=>'boolean']; public function groups(){return $this->hasMany(AnalysisGroup::class);} public function tests(){return $this->hasMany(MedicalTest::class);} }
