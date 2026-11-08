<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TestMaterialRequirement extends Model {
    protected $guarded=[];
    protected $casts=['shareable'=>'boolean','is_customized'=>'boolean','validated_at'=>'datetime','minimum_volume_ml'=>'decimal:2'];
    public function medicalTest(){ return $this->belongsTo(MedicalTest::class); }
    public function material(){ return $this->belongsTo(CollectionTube::class,'collection_tube_id'); }
}
