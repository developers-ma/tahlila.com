<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;
    protected $fillable = ['product_name','product_color','track_inventory','quantity','quantity_used'];
    protected $casts = ['track_inventory'=>'boolean'];

}
