<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['recipient_id', 'read_at']);
            $table->index(['sender_id', 'recipient_id', 'created_at']);
        });

        DB::table('roles')->where('slug', '!=', 'administrator')->get()->each(function (object $role): void {
            $permissions = json_decode($role->permissions, true) ?: [];
            if (! in_array('chat.use', $permissions, true)) {
                $permissions[] = 'chat.use';
                DB::table('roles')->where('id', $role->id)->update(['permissions' => json_encode($permissions, JSON_THROW_ON_ERROR)]);
            }
        });

        DB::table('users')->whereNotNull('permissions')->get()->each(function (object $user): void {
            $permissions = json_decode($user->permissions, true) ?: [];
            if (! in_array('chat.use', $permissions, true)) {
                $permissions[] = 'chat.use';
                DB::table('users')->where('id', $user->id)->update(['permissions' => json_encode($permissions, JSON_THROW_ON_ERROR)]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
