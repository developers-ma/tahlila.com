<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ColorSetting extends Model
{
    use HasFactory;

    public const DEFAULTS = [
        'primary_color' => '#000000',
        'secondary_color' => '#b8ed83',
        'tertiary_color' => '#e8f4da',
        'neutral_color' => '#7c8a71',
        'background_color' => '#f7f8f5',
        'font_color' => '#203023',
        'success_color' => '#58852a',
        'info_color' => '#5579b0',
        'warning_color' => '#947325',
        'error_color' => '#b04336',
    ];

    protected $fillable = [
        'primary_color', 'secondary_color', 'tertiary_color', 'neutral_color',
        'background_color', 'font_color', 'success_color', 'info_color',
        'warning_color', 'error_color',
    ];
}
