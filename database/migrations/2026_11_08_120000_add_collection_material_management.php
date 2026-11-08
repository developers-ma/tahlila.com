<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            $table->boolean('track_inventory')->default(true)->after('product_color');
        });
        Schema::table('collection_tubes', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->string('category')->default('tube')->after('name_en');
            $table->string('physical_form')->nullable();
            $table->string('cap_color')->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->string('compatible_specimen')->nullable();
            $table->decimal('capacity_ml', 8, 2)->nullable();
            $table->decimal('minimum_volume_ml', 8, 2)->nullable();
            $table->decimal('recommended_volume_ml', 8, 2)->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('commercial_reference')->nullable();
            $table->text('storage_conditions')->nullable();
            $table->text('transport_conditions')->nullable();
            $table->text('instructions')->nullable();
            $table->foreignId('stock_id')->nullable()->constrained('stocks')->nullOnDelete();
            $table->boolean('is_active')->default(true);
        });
        Schema::create('test_material_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_test_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collection_tube_id')->constrained()->restrictOnDelete();
            $table->string('role', 20)->default('primary');
            $table->unsignedTinyInteger('preference')->default(1);
            $table->unsignedInteger('quantity')->nullable();
            $table->decimal('minimum_volume_ml', 8, 2)->nullable();
            $table->boolean('shareable')->default(false);
            $table->text('collection_instructions')->nullable();
            $table->string('validation_status', 20)->default('to_verify');
            $table->boolean('is_customized')->default(false);
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
            $table->unique(['medical_test_id','collection_tube_id']);
            $table->index(['medical_test_id','role','preference'], 'test_material_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_material_requirements');
        Schema::table('collection_tubes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stock_id');
            $table->dropColumn(['name_en','category','physical_form','cap_color','color_hex','compatible_specimen','capacity_ml','minimum_volume_ml','recommended_volume_ml','manufacturer','commercial_reference','storage_conditions','transport_conditions','instructions','is_active']);
        });
        Schema::table('stocks', fn (Blueprint $table) => $table->dropColumn('track_inventory'));
    }
};
