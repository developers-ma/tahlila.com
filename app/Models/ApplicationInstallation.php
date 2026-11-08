<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ApplicationInstallation extends Model { protected $guarded=[]; protected $casts=['completed_at'=>'datetime']; public function administrator(){return $this->belongsTo(User::class,'administrator_id');} }
