<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = ['firstname', 'lastname', 'date_of_birth', 'phone', 'email', 'gender', 'id_card', 'has_insurance', 'is_child', 'parent_id_card', 'child_number'];

    protected $casts = [
        'date_of_birth' => 'date',
        'has_insurance' => 'boolean',
        'is_child' => 'boolean',
        'child_number' => 'integer',
    ];

    public function tests()
    {
        return $this->hasMany(Test::class);
    }

    public function account()
    {
        return $this->hasOne(PatientAccount::class);
    }
}
