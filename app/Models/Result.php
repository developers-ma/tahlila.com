<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    use HasFactory;
    protected $table = 'test_for_patients';
    protected $fillable = ['test_result_value', 'test_result_value_2', 'patient_age', 'patient_weight', 'patient_height', 'conclusion'];

}