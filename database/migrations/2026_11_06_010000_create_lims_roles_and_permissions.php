<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('permissions');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('role_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->json('permissions')->nullable()->after('password');
        });

        $now = now();
        foreach (config('lims_permissions.roles') as $slug => $role) {
            DB::table('roles')->insert([
                'name' => $role['name'],
                'slug' => $slug,
                'description' => $role['description'],
                'permissions' => json_encode($role['permissions'], JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Existing installations keep their current access until an administrator
        // assigns narrower roles from the Team page.
        $administratorId = DB::table('roles')->where('slug', 'administrator')->value('id');
        DB::table('users')->whereNull('role_id')->update(['role_id' => $administratorId]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn('permissions');
        });
        Schema::dropIfExists('roles');
    }
};
