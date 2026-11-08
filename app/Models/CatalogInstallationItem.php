<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CatalogInstallationItem extends Model { protected $guarded=[]; protected $casts=['metadata'=>'array']; }
