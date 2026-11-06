<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $receptionRoleId = DB::table('roles')->where('slug', 'reception')->value('id');

        if ($receptionRoleId) {
            DB::table('users')
                ->where('email', 'reception@tahlila.test')
                ->update(['role_id' => $receptionRoleId, 'permissions' => null]);
        }
    }

    public function down(): void
    {
        // Role changes made later by an administrator must not be overwritten.
    }
};
