<?php

use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ColorSettingController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\EmailSettingController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LaboratorySettingController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientPortalSettingController;
use App\Http\Controllers\PriceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/csrf-token', fn () => response()->json([
    'token' => csrf_token(),
]))->name('csrf.token');

Route::get('/session/keep-alive', function (Request $request) {
    $request->session()->put('_last_keep_alive', now()->timestamp);

    return response()->noContent()->header('Cache-Control', 'no-store');
})->name('session.keep-alive');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/prices', [PriceController::class, 'store'])->middleware('permission:catalog.manage')->name('prices.store');
    Route::match(['put', 'patch'], '/prices/{price}', [PriceController::class, 'update'])->middleware('permission:catalog.manage')->name('prices.update');
    Route::delete('/prices/{price}', [PriceController::class, 'destroy'])->middleware('permission:catalog.manage')->name('prices.destroy');

    Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:catalog.manage')->name('categories.store');
    Route::match(['put', 'patch'], '/categories/{category}', [CategoryController::class, 'update'])->middleware('permission:catalog.manage')->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:catalog.manage')->name('categories.destroy');

    Route::post('/groups', [GroupController::class, 'store'])->middleware('permission:catalog.manage')->name('groups.store');
    Route::match(['put', 'patch'], '/groups/{group}', [GroupController::class, 'update'])->middleware('permission:catalog.manage')->name('groups.update');
    Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->middleware('permission:catalog.manage')->name('groups.destroy');

    Route::put('/invoices/{test}', [InvoiceController::class, 'changeremainingorgiving'])->middleware('permission:invoices.manage')->name('invoices.changeremainingorgiving');
    Route::put('/results/{results}', [ResultController::class, 'update'])->middleware('permission:results.manage')->name('results.update');

    Route::post('/product/create', [StockController::class, 'store'])->middleware('permission:inventory.manage')->name('stocks.store');
    Route::put('/product/{product}/edit', [StockController::class, 'update'])->middleware('permission:inventory.manage')->name('products.update');
    Route::delete('/product/{product}', [StockController::class, 'destroy'])->middleware('permission:inventory.manage')->name('products.destroy');

    Route::put('/all-barcodes/{test}', [TestController::class, 'changestatus'])->middleware('permission:collection.manage')->name('allbarcodes.changestatus');
    Route::delete('/all-barcodes/{test}', [TestController::class, 'destroytest'])->middleware('permission:orders.manage')->name('allbarcodes.destroytest');

    Route::post('/email', [EmailController::class, 'sendEmail'])->middleware('permission:email.send')->name('send.email.legacy');
    Route::post('/email/send', [EmailController::class, 'sendEmail'])->middleware('permission:email.send')->name('send.email');
    Route::post('/email/messages/{uid}/flag', [EmailController::class, 'flag'])->whereNumber('uid')->middleware('permission:email.send')->name('email.messages.flag');
    Route::get('/email/messages/{uid}/attachments/{part}', [EmailController::class, 'attachment'])->whereNumber('uid')->where('part', '[0-9.]+')->middleware('permission:email.send')->name('email.attachments.download');
    Route::post('/send-test-result-email', [EmailController::class, 'sendTestResultEmail'])->middleware('permission:email.send')->name('send.email.results');
    Route::post('/chat/messages', [ChatController::class, 'store'])->middleware('permission:chat.use')->name('chat.messages.store');
    Route::get('/api/chat/conversation/{user}', [ChatController::class, 'conversation'])->middleware('permission:chat.use')->name('chat.conversation');
    Route::get('/api/chat/unread', [ChatController::class, 'unread'])->middleware('permission:chat.use')->name('chat.unread');
    Route::get('/chat/attachments/{attachment}', [ChatController::class, 'attachment'])->middleware('permission:chat.use')->name('chat.attachments.download');

    Route::post('/setting/payment', [SettingController::class, 'payment'])->middleware('permission:settings.manage')->name('settings.payment.store');
    Route::post('/setting/colors', [ColorSettingController::class, 'update'])->middleware('permission:settings.manage')->name('settings.colors.update');
    Route::post('/setting/colors/reset', [ColorSettingController::class, 'reset'])->middleware('permission:settings.manage')->name('settings.colors.reset');
    Route::post('/setting/email', [EmailSettingController::class, 'store'])->middleware('permission:settings.manage')->name('settings.email.store');
    Route::post('/setting/patient-portal', [PatientPortalSettingController::class, 'update'])->middleware('permission:settings.manage')->name('settings.patient-portal.update');
    Route::post('/laboratory-settings', [LaboratorySettingController::class, 'store'])->middleware('permission:settings.manage')->name('laboratory-settings.store');
    Route::post('/languages/{lang}/activate', [LanguageController::class, 'activate'])->middleware('permission:settings.manage')->name('languages.activate');
    Route::post('/languages/{lang}/update', [LanguageController::class, 'update'])->middleware('permission:settings.manage')->name('languages.update');

    Route::post('/patients', [PatientController::class, 'store'])->middleware('permission:patients.manage')->name('patients.store');
    Route::match(['put', 'patch'], '/patients/{patient}', [PatientController::class, 'update'])->middleware('permission:patients.manage')->name('patients.update');
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->middleware('permission:patients.manage')->name('patients.destroy');
    Route::post('/patients/search', [PatientController::class, 'search'])->middleware('permission:patients.manage')->name('patients.search');

    Route::post('/tests', [TestController::class, 'store'])->middleware('permission:orders.manage')->name('tests.store');
    Route::match(['put', 'patch'], '/tests/{test}', [TestController::class, 'update'])->middleware('permission:orders.manage')->name('tests.update');
    Route::delete('/tests/{test}', [TestController::class, 'destroy'])->middleware('permission:orders.manage')->name('tests.destroy');
    Route::post('/tests/create', [TestController::class, 'store'])->middleware('permission:orders.manage')->name('tests.store.create');
    Route::put('/tests/{test}/edit', [TestController::class, 'update'])->middleware('permission:orders.manage')->name('tests.update.edit');
    Route::put('/test/barcodes/{test}', [BarcodeController::class, 'update'])->middleware('permission:collection.manage')->name('barcodes.update');
    Route::post('/test/barcodes/{test}/print-settings', [BarcodeController::class, 'savePrintSettings'])->middleware('permission:collection.manage')->name('barcodes.print-settings');

    Route::post('/staff', [StaffController::class, 'store'])->middleware('permission:staff.manage')->name('staff.store');
    Route::put('/staff/{user}', [StaffController::class, 'update'])->middleware('permission:staff.manage')->name('staff.update');
    Route::delete('/staff/{user}', [StaffController::class, 'destroy'])->middleware('permission:staff.manage')->name('staff.destroy');
});

Route::middleware('auth')->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
require __DIR__.'/patient.php';
require __DIR__.'/lims.php';
