<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CollectionTube extends Model {
    protected $guarded=[];
    protected $casts=['is_active'=>'boolean','capacity_ml'=>'decimal:2','minimum_volume_ml'=>'decimal:2','recommended_volume_ml'=>'decimal:2'];
    public function stock(){ return $this->belongsTo(Stock::class); }
    public function requirements(){ return $this->hasMany(TestMaterialRequirement::class); }
}
