<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('application_installations', function (Blueprint $table) {
            $table->id();
            $table->string('current_step')->default('account');
            $table->foreignId('administrator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        DB::table('application_installations')->insert([
            'id'=>1,
            'current_step'=>DB::table('users')->exists() ? 'completed' : 'account',
            'administrator_id'=>DB::table('users')->orderBy('id')->value('id'),
            'completed_at'=>DB::table('users')->exists() ? now() : null,
            'created_at'=>now(), 'updated_at'=>now(),
        ]);
    }
    public function down(): void { Schema::dropIfExists('application_installations'); }
};
