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
        Schema::create('color_settings', function (Blueprint $table) {
            $table->id();
            $table->string('primary_color')->default('#2b7232');
            $table->string('secondary_color')->default('#76bd90');
            $table->string('tertiary_color')->default('#4caf5024');
            $table->string('neutral_color')->default('#000000');
            $table->string('background_color')->default('#F3F4F6');
            $table->string('font_color')->default('#6b6b6b');
            $table->string('success_color')->default('#4CAF50');
            $table->string('info_color')->default('#2196F3');
            $table->string('warning_color')->default('#ff0000');
            $table->string('error_color')->default('#f1aeb5');
            $table->timestamps();
        });

         // Insert default row with predefined color values
         DB::table('color_settings')->insert([
            'primary_color' => '#2b7232',
            'secondary_color' => '#76bd90',
            'tertiary_color' => '#4caf5024',
            'neutral_color' => '#000000',
            'background_color' => '#F3F4F6',
            'font_color' => '#6b6b6b',
            'success_color' => '#4CAF50',
            'info_color' => '#2196F3',
            'warning_color' => '#ff0000',
            'error_color' => '#f1aeb5',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('color_settings');
    }
};