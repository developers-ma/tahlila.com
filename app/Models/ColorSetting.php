<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ColorSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'primary_color', 'secondary_color', 'tertiary_color', 'neutral_color', 
        'background_color', 'font_color', 'success_color', 'info_color', 
        'warning_color', 'error_color'
    ];
}