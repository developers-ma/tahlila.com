<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ParameterReferenceRange extends Model { protected $guarded=[]; protected $casts=['validated_at'=>'datetime']; public function parameter(){return $this->belongsTo(TestParameter::class,'test_parameter_id');} public function validator(){return $this->belongsTo(User::class,'validated_by');} }
