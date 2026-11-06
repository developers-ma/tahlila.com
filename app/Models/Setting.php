<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['default_language', 'patient_portal_enabled'];

    protected $casts = ['patient_portal_enabled' => 'boolean'];
}
