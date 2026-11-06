<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailSetting extends Model
{
    use HasFactory;

        // Define the table name (optional, Laravel will guess it as 'email_settings')
        protected $table = 'email_settings';

        // Define the fillable fields (to allow mass assignment)
        protected $fillable = [
            'mail_driver', 
            'mail_host', 
            'mail_port', 
            'mail_username', 
            'mail_password', 
            'mail_encryption',
            'email_notification',
            'mail_from_address',
            'mail_from_name'
        ];
    
        // You may also want to protect sensitive fields like 'mail_password'
        protected $hidden = [
            'mail_password',
        ];
}