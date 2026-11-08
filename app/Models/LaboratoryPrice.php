<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LaboratoryPrice extends Model { protected $guarded=[]; protected $casts=['effective_from'=>'date','effective_until'=>'date','is_active'=>'boolean']; public function priceable(){return $this->morphTo();} }
