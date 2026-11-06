<?php

use App\Http\Controllers\PatientPortalAuthController;
use App\Http\Controllers\PatientPortalController;
use Illuminate\Support\Facades\Route;

$publicPages = [
    '/patient/login' => 'patient.login',
    '/patient/forgot-password' => 'patient.forgot-password',
    '/patient/reset-password/{token}' => 'patient.reset-password',
];

$protectedPages = [
    '/patient/dashboard' => 'patient.dashboard',
    '/patient/results/{id}' => 'patient.result',
];

$registerPatientPages = function (array $pages, bool $json = false): void {
    foreach ($pages as $uri => $screen) {
        $route = Route::get($uri, PatientPortalController::class)->defaults('screen', $screen);
        if (! $json) {
            $route->name($screen);
        }
    }
};

Route::middleware('patient.portal')->group(function () use ($publicPages, $protectedPages, $registerPatientPages) {
    $registerPatientPages($publicPages);
    Route::middleware('patient.auth')->group(function () use ($protectedPages, $registerPatientPages) {
        $registerPatientPages($protectedPages);
        Route::post('/patient/logout', [PatientPortalAuthController::class, 'logout'])->name('patient.logout');
    });

    Route::post('/patient/login', [PatientPortalAuthController::class, 'login'])->name('patient.login.store');
    Route::post('/patient/forgot-password', [PatientPortalAuthController::class, 'requestReset'])->name('patient.password.email');
    Route::post('/patient/reset-password', [PatientPortalAuthController::class, 'reset'])->name('patient.password.update');
});

Route::prefix('/api/lims')->middleware('patient.portal')->group(function () use ($publicPages, $protectedPages, $registerPatientPages) {
    $registerPatientPages($publicPages, true);
    Route::middleware('patient.auth')->group(function () use ($protectedPages, $registerPatientPages) {
        $registerPatientPages($protectedPages, true);
    });
});
