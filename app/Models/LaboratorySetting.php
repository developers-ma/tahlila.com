<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LaboratorySetting extends Model
{
    use HasFactory;

    protected $appends = [
        'logo_url',
    ];

    protected $fillable = [
        'laboratory_name',
        'managing_director',
        'phone',
        'fax',
        'email',
        'address',
        'company_number',
        'tax_id',
        'logo',
        'footer_title1',
        'footer_title2',
        'footer_title3',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo
            ? Storage::disk('public')->url($this->logo)
            : null;
    }
}
