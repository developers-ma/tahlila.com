<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LaboratoryTest extends Model { protected $guarded=[]; protected $casts=['is_active'=>'boolean','operational_overrides'=>'array']; public function test(){return $this->belongsTo(MedicalTest::class,'medical_test_id');} public function prices(){return $this->morphMany(LaboratoryPrice::class,'priceable');} }
