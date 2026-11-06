<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'mail_driver', 'mail_host', 'mail_port', 'mail_username', 'mail_password',
        'mail_encryption', 'email_notification', 'mail_from_address', 'mail_from_name',
        'imap_host', 'imap_port', 'imap_encryption', 'imap_username', 'imap_password',
        'imap_validate_cert',
    ];

    protected $hidden = ['mail_password', 'imap_password'];

    protected $casts = ['imap_validate_cert' => 'boolean'];

    public function mailboxConfigured(): bool
    {
        return filled($this->mail_host)
            && filled($this->mail_username)
            && filled($this->mail_password)
            && filled($this->imap_host)
            && filled($this->imap_username)
            && filled($this->imap_password)
            && ! in_array($this->mail_username, ['your_username', 'null'], true)
            && ! in_array($this->mail_password, ['your_password', 'null'], true);
    }
}
