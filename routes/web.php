<?php

use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorSettingController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\EmailSettingController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LaboratorySettingController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/prices', [PriceController::class, 'store'])->name('prices.store');
    Route::match(['put', 'patch'], '/prices/{price}', [PriceController::class, 'update'])->name('prices.update');
    Route::delete('/prices/{price}', [PriceController::class, 'destroy'])->name('prices.destroy');

    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::match(['put', 'patch'], '/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
    Route::match(['put', 'patch'], '/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
    Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');

    Route::put('/invoices/{test}', [InvoiceController::class, 'changeremainingorgiving'])->name('invoices.changeremainingorgiving');
    Route::put('/results/{results}', [ResultController::class, 'update'])->name('results.update');

    Route::post('/product/create', [StockController::class, 'store'])->name('stocks.store');
    Route::put('/product/{product}/edit', [StockController::class, 'update'])->name('products.update');
    Route::delete('/product/{product}', [StockController::class, 'destroy'])->name('products.destroy');

    Route::put('/all-barcodes/{test}', [TestController::class, 'changestatus'])->name('allbarcodes.changestatus');
    Route::delete('/all-barcodes/{test}', [TestController::class, 'destroytest'])->name('allbarcodes.destroytest');

    Route::post('/email', [EmailController::class, 'sendEmail'])->name('send.email');
    Route::post('/send-test-result-email', [EmailController::class, 'sendTestResultEmail'])->name('send.email.results');

    Route::post('/setting/payment', [SettingController::class, 'payment'])->name('settings.payment.store');
    Route::post('/setting/colors', [ColorSettingController::class, 'update'])->name('settings.colors.update');
    Route::post('/setting/email', [EmailSettingController::class, 'store'])->name('settings.email.store');
    Route::post('/laboratory-settings', [LaboratorySettingController::class, 'store'])->name('laboratory-settings.store');
    Route::post('/languages/{lang}/activate', [LanguageController::class, 'activate'])->name('languages.activate');
    Route::post('/languages/{lang}/update', [LanguageController::class, 'update'])->name('languages.update');

    Route::post('/patients', [PatientController::class, 'store'])->name('patients.store');
    Route::match(['put', 'patch'], '/patients/{patient}', [PatientController::class, 'update'])->name('patients.update');
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy');
    Route::post('/patients/search', [PatientController::class, 'search'])->name('patients.search');

    Route::post('/tests', [TestController::class, 'store'])->name('tests.store');
    Route::match(['put', 'patch'], '/tests/{test}', [TestController::class, 'update'])->name('tests.update');
    Route::delete('/tests/{test}', [TestController::class, 'destroy'])->name('tests.destroy');
    Route::post('/tests/create', [TestController::class, 'store'])->name('tests.store.create');
    Route::put('/tests/{test}/edit', [TestController::class, 'update'])->name('tests.update.edit');
    Route::put('/test/barcodes/{test}', [BarcodeController::class, 'update'])->name('barcodes.update');
});

Route::middleware('auth')->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
require __DIR__.'/lims.php';
