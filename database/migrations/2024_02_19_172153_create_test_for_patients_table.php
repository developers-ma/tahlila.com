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
        Schema::create('test_for_patients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('test_id');
            $table->unsignedBigInteger('price_id');
            $table->text('group_id')->nullable();
            $table->text('category_id')->nullable();
            $table->text('test_result_value')->nullable(); //new
            $table->text('test_result_value_2')->nullable(); //new
            $table->text('patient_age')->nullable(); //new
            $table->text('patient_weight')->nullable(); //new
            $table->text('patient_height')->nullable(); //new
            $table->text('conclusion')->nullable(); //new

            $table->timestamps();

            $table->foreign('test_id')->references('id')->on('tests')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_for_patients');
    }
};