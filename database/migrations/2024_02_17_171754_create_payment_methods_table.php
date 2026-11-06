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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->text('cash')->nullable();
            $table->text('pos')->nullable();
            $table->text('bank_transfer')->nullable();
            $table->text('cheque')->nullable();
            $table->text('currency')->nullable();
            $table->decimal('tax')->nullable();
            $table->timestamps();
        });

        // Inserting default data
        DB::table('payment_methods')->insert([
            'id' => 1,
            'cash' => 'true',
            'pos' => 'true',
            'bank_transfer' => 'true',
            'cheque' => 'true',
            'currency' => 'USD',
            'tax' => '20',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};