<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->boolean('has_insurance')->default(false)->after('id_card');
            $table->boolean('is_child')->default(false)->after('has_insurance');
            $table->string('parent_id_card')->nullable()->after('is_child');
            $table->unsignedInteger('child_number')->nullable()->after('parent_id_card');
            $table->index(['parent_id_card', 'child_number']);
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['parent_id_card', 'child_number']);
            $table->dropColumn([
                'has_insurance',
                'is_child',
                'parent_id_card',
                'child_number',
            ]);
        });
    }
};
