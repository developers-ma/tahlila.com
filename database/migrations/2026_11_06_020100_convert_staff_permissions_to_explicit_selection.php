<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roles = DB::table('roles')->get()->keyBy('id');

        DB::table('users')->whereNotNull('role_id')->orderBy('id')->each(function (object $user) use ($roles): void {
            $role = $roles->get($user->role_id);
            if (! $role || $role->slug === 'administrator') {
                return;
            }

            $rolePermissions = json_decode($role->permissions ?? '[]', true) ?: [];
            $individualPermissions = json_decode($user->permissions ?? '[]', true) ?: [];
            $permissions = array_values(array_unique(array_merge($rolePermissions, $individualPermissions)));

            DB::table('users')->where('id', $user->id)->update([
                'permissions' => json_encode($permissions, JSON_THROW_ON_ERROR),
            ]);
        });

        DB::table('users')
            ->whereIn('role_id', DB::table('roles')->select('id')->where('slug', 'administrator'))
            ->update(['permissions' => null]);
    }

    public function down(): void
    {
        // The explicit selection contains every previously effective permission,
        // so retaining it is the safest reversible behaviour for user access.
    }
};
