<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('categories', function(Blueprint $table){ $table->foreignId('medical_category_id')->nullable()->unique()->constrained()->nullOnDelete(); });
        Schema::table('groups', function(Blueprint $table){ $table->foreignId('analysis_group_id')->nullable()->unique()->constrained()->nullOnDelete(); });
        Schema::table('prices', function(Blueprint $table){ $table->foreignId('medical_test_id')->nullable()->unique()->constrained()->nullOnDelete(); });
    }
    public function down(): void {
        Schema::table('prices', fn(Blueprint $table)=>$table->dropConstrainedForeignId('medical_test_id'));
        Schema::table('groups', fn(Blueprint $table)=>$table->dropConstrainedForeignId('analysis_group_id'));
        Schema::table('categories', fn(Blueprint $table)=>$table->dropConstrainedForeignId('medical_category_id'));
    }
};
