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
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->decimal('total_price', 10, 2);
            $table->string('payment_method');
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('remaining_or_give', 10, 2);
            $table->text('test_status')->nullable(); // display tests status : pas encore depiste | en traitement ...
            $table->text('prelevement_date')->nullable(); // date de prelevement
            $table->timestamps();

            // Define foreign key constraint
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};