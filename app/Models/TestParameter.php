<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TestParameter extends Model { protected $guarded=[]; protected $casts=['is_active'=>'boolean']; public function test(){return $this->belongsTo(MedicalTest::class,'medical_test_id');} public function referenceRanges(){return $this->hasMany(ParameterReferenceRange::class);} }
