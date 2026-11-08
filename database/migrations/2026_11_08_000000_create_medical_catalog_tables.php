<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_versions', function (Blueprint $table) {
            $table->id(); $table->string('version')->unique(); $table->string('source')->nullable();
            $table->text('notes')->nullable(); $table->timestamp('published_at')->nullable(); $table->timestamps();
        });
        Schema::create('medical_categories', function (Blueprint $table) {
            $table->id(); $table->foreignId('catalog_version_id')->constrained()->cascadeOnDelete();
            $table->string('code'); $table->string('name'); $table->string('icon')->nullable();
            $table->string('color', 20)->nullable(); $table->unsignedInteger('sort_order')->default(0); $table->boolean('is_active')->default(true); $table->timestamps();
            $table->unique(['catalog_version_id', 'code']);
        });
        Schema::create('specimen_types', function (Blueprint $table) {
            $table->id(); $table->string('code')->unique(); $table->string('name'); $table->text('description')->nullable(); $table->timestamps();
        });
        Schema::create('collection_tubes', function (Blueprint $table) {
            $table->id(); $table->string('code')->unique(); $table->string('name'); $table->string('color')->nullable(); $table->string('additive')->nullable(); $table->timestamps();
        });
        Schema::create('analysis_groups', function (Blueprint $table) {
            $table->id(); $table->foreignId('medical_category_id')->constrained()->cascadeOnDelete();
            $table->string('code'); $table->string('name'); $table->text('description')->nullable(); $table->boolean('is_active')->default(true); $table->timestamps();
            $table->unique(['medical_category_id', 'code']);
        });
        Schema::create('medical_tests', function (Blueprint $table) {
            $table->id(); $table->foreignId('medical_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specimen_type_id')->nullable()->constrained()->nullOnDelete(); $table->foreignId('collection_tube_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique(); $table->string('name'); $table->string('abbreviation')->nullable(); $table->json('synonyms')->nullable();
            $table->text('description')->nullable(); $table->string('loinc_code')->nullable(); $table->string('result_type')->default('numeric');
            $table->string('unit')->nullable(); $table->unsignedTinyInteger('decimal_precision')->default(2); $table->string('method')->nullable(); $table->text('calculation_formula')->nullable();
            $table->decimal('required_volume_ml', 8, 2)->nullable(); $table->text('collection_conditions')->nullable(); $table->text('storage_conditions')->nullable();
            $table->text('transport_conditions')->nullable(); $table->unsignedInteger('max_transport_minutes')->nullable(); $table->text('precautions')->nullable();
            $table->boolean('fasting_required')->default(false); $table->text('patient_preparation')->nullable();
            $table->unsignedInteger('routine_tat_minutes')->nullable(); $table->unsignedInteger('urgent_tat_minutes')->nullable();
            $table->string('performing_laboratory')->nullable(); $table->boolean('can_be_outsourced')->default(false); $table->boolean('is_active')->default(true);
            $table->string('source_type')->default('common'); $table->string('source_reference')->nullable(); $table->timestamps();
            $table->index(['medical_category_id', 'is_active']);
        });
        Schema::create('test_parameters', function (Blueprint $table) {
            $table->id(); $table->foreignId('medical_test_id')->constrained()->cascadeOnDelete(); $table->string('code'); $table->string('name');
            $table->string('abbreviation')->nullable(); $table->string('result_type')->default('numeric'); $table->string('unit')->nullable();
            $table->unsignedTinyInteger('decimal_precision')->default(2); $table->string('method')->nullable(); $table->text('formula')->nullable();
            $table->unsignedInteger('sort_order')->default(0); $table->boolean('is_active')->default(true); $table->timestamps(); $table->unique(['medical_test_id', 'code']);
        });
        Schema::create('group_test_items', function (Blueprint $table) {
            $table->id(); $table->foreignId('analysis_group_id')->constrained()->cascadeOnDelete(); $table->foreignId('medical_test_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0); $table->timestamps(); $table->unique(['analysis_group_id', 'medical_test_id']);
        });
        Schema::create('parameter_reference_ranges', function (Blueprint $table) {
            $table->id(); $table->foreignId('test_parameter_id')->constrained()->cascadeOnDelete(); $table->string('sex', 20)->default('all');
            $table->unsignedInteger('age_min_days')->nullable(); $table->unsignedInteger('age_max_days')->nullable(); $table->string('pregnancy_trimester', 20)->nullable();
            $table->foreignId('specimen_type_id')->nullable()->constrained()->nullOnDelete(); $table->string('method')->nullable(); $table->string('analyzer')->nullable();
            $table->decimal('lower_bound', 18, 6)->nullable(); $table->decimal('upper_bound', 18, 6)->nullable(); $table->string('qualitative_value')->nullable();
            $table->decimal('critical_low', 18, 6)->nullable(); $table->decimal('critical_high', 18, 6)->nullable(); $table->string('unit')->nullable();
            $table->string('validation_status')->default('to_verify'); $table->text('source_citation')->nullable(); $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable(); $table->timestamps(); $table->index(['test_parameter_id', 'sex', 'validation_status'], 'parameter_ranges_lookup');
        });
        Schema::create('laboratory_groups', function (Blueprint $table) {
            $table->id(); $table->foreignId('analysis_group_id')->constrained()->cascadeOnDelete(); $table->string('custom_name')->nullable();
            $table->boolean('is_active')->default(true); $table->timestamps(); $table->unique('analysis_group_id');
        });
        Schema::create('laboratory_tests', function (Blueprint $table) {
            $table->id(); $table->foreignId('medical_test_id')->constrained()->cascadeOnDelete(); $table->boolean('is_active')->default(true);
            $table->json('operational_overrides')->nullable(); $table->timestamps(); $table->unique('medical_test_id');
        });
        Schema::create('laboratory_prices', function (Blueprint $table) {
            $table->id(); $table->nullableMorphs('priceable'); $table->decimal('amount', 12, 2); $table->string('currency', 3)->default('MAD');
            $table->string('convention')->nullable(); $table->decimal('discount_percent', 5, 2)->default(0); $table->date('effective_from'); $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true); $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps();
            $table->index(['priceable_type', 'priceable_id', 'effective_from'], 'laboratory_prices_lookup');
        });
        Schema::create('catalog_installations', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignId('catalog_version_id')->constrained(); $table->string('status')->default('pending');
            $table->json('summary')->nullable(); $table->text('error_message')->nullable(); $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable(); $table->timestamps();
        });
        Schema::create('catalog_installation_items', function (Blueprint $table) {
            $table->id(); $table->uuid('catalog_installation_id'); $table->string('item_type'); $table->unsignedBigInteger('item_id'); $table->string('status')->default('installed');
            $table->json('metadata')->nullable(); $table->timestamps(); $table->foreign('catalog_installation_id')->references('id')->on('catalog_installations')->cascadeOnDelete();
            $table->unique(['catalog_installation_id', 'item_type', 'item_id'], 'catalog_installation_item_unique');
        });
    }

    public function down(): void
    {
        foreach (['catalog_installation_items','catalog_installations','laboratory_prices','laboratory_tests','laboratory_groups','parameter_reference_ranges','group_test_items','test_parameters','medical_tests','analysis_groups','collection_tubes','specimen_types','medical_categories','catalog_versions'] as $table) Schema::dropIfExists($table);
    }
};
