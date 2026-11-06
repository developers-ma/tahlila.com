<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Test;

class Patient extends Model
{
    use HasFactory;
    protected $fillable = ['firstname', 'lastname', 'date_of_birth', 'phone', 'email', 'gender', 'id_card'];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function tests()
    {
        return $this->hasMany(Test::class);
    }

}
