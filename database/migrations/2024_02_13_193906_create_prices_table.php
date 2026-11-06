<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            $table->string('test_name')->nullable();
            $table->text('test_description')->nullable();
            $table->text('test_unit')->nullable();
            $table->text('test_reference_value')->nullable();
            $table->text('test_unit_2')->nullable();
            $table->text('test_reference_value_2')->nullable();
            $table->text('test_required_age')->nullable();
            $table->text('test_required_weight')->nullable();
            $table->text('test_required_height')->nullable();
            $table->text('test_requiring_conclusion')->nullable();
            $table->decimal('price');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};