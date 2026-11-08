<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class CatalogInstallation extends Model { use HasUuids; public $incrementing=false; protected $keyType='string'; protected $guarded=[]; protected $casts=['summary'=>'array','completed_at'=>'datetime']; public function items(){return $this->hasMany(CatalogInstallationItem::class);} }
