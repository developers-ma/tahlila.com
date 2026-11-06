<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatAttachment extends Model
{
    protected $fillable = ['chat_message_id', 'path', 'original_name', 'mime_type', 'size'];

    protected $hidden = ['path', 'chat_message_id', 'created_at', 'updated_at'];

    protected $appends = ['url', 'is_image'];

    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'chat_message_id');
    }

    public function getUrlAttribute(): string
    {
        return route('chat.attachments.download', $this);
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }
}
