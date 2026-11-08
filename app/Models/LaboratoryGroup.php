<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LaboratoryGroup extends Model { protected $guarded=[]; protected $casts=['is_active'=>'boolean']; public function group(){return $this->belongsTo(AnalysisGroup::class,'analysis_group_id');} public function prices(){return $this->morphMany(LaboratoryPrice::class,'priceable');} }
