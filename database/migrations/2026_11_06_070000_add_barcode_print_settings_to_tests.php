<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table): void {
            $table->json('tube_copies')->nullable()->after('prelevement_date');
            $table->string('tube_label_format', 10)->nullable()->after('tube_copies');
        });
    }

    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table): void {
            $table->dropColumn(['tube_copies', 'tube_label_format']);
        });
    }
};
