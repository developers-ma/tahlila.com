<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('laboratory_settings', function (Blueprint $table) {
            $table->id();
            $table->string('laboratory_name');
            $table->string('managing_director');
            $table->string('phone');
            $table->string('fax');
            $table->string('email');
            $table->string('address');
            $table->string('company_number');
            $table->string('tax_id');
            $table->string('logo')->nullable();
            $table->string('footer_title1');
            $table->string('footer_title2');
            $table->string('footer_title3');
            $table->timestamps();
        });

        // Insert default data
        DB::table('laboratory_settings')->insert([
            'laboratory_name' => 'Tahlila Medical Analysis Laboratory',
            'managing_director' => 'Salaheddine es-sbai',
            'phone' => '0619888261',
            'fax' => '0619888261',
            'email' => 'email@tahlila.com',
            'address' => '1er étage, 23 Bd Mohammed V, Fès 30050',
            'company_number' => '00000488437',
            'tax_id' => '00000488437',
            'logo' => null,  // Default logo, or you can upload one later
            'footer_title1' => 'Tahlila Medical Analysis Laboratory',
            'footer_title2' => 'Phone: 0619888261',
            'footer_title3' => 'Fès, Morocco',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laboratory_settings');
    }
};