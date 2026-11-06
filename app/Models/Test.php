<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;

class Test extends Model

{
    protected $fillable = ['patient_id', 'total_price', 'payment_method', 'paid_amount', 'remaining_or_give', 'test_status', 'prelevement_date'];

    protected $casts = [
        'total_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_or_give' => 'decimal:2',
        'prelevement_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function prices()
    {
        return $this->belongsToMany(Price::class,  'test_for_patients')->withTimestamps();
    }

}
