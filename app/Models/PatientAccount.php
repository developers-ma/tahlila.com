<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;

class PatientAccount extends Model
{
    use Notifiable;

    protected $fillable = ['patient_id', 'email', 'password', 'active', 'last_login_at'];

    protected $hidden = ['password'];

    protected $casts = [
        'password' => 'hashed',
        'active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function routeNotificationForMail(): string
    {
        return $this->email;
    }
}
