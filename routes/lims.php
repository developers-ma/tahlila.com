<?php

use App\Http\Controllers\LimsPageController;
use Illuminate\Support\Facades\Route;

$protectedPages = [
    '/' => ['dashboard', 'dashboard.root'],
    '/dashboard' => ['dashboard', 'dashboard'],
    '/new-test' => ['newtest', 'newtest'],
    '/tests' => ['tests', 'tests'],
    '/tests/create' => ['order', 'tests.create'],
    '/tests/{id}/edit' => ['order', 'tests.edit'],
    '/tests/{id}' => ['result', 'tests.show'],
    '/results' => ['results', 'results'],
    '/results/{id}/edit' => ['result', 'results.edit'],
    '/invoices' => ['invoices', 'invoices'],
    '/invoice/{id}' => ['invoice', 'invoice.generateInvoice'],
    '/all-barcodes' => ['all-barcodes', 'all-barcodes'],
    '/test/barcodes/{id}' => ['barcode', 'barcodes'],
    '/print/result/{id}' => ['report', 'results.report'],
    '/staff' => ['staff', 'staff'],
    '/email' => ['email', 'email'],
    '/settings' => ['settings', 'settings'],
    '/update' => ['update', 'update'],
    '/profile' => ['profile', 'profile.edit'],
    '/languages' => ['languages', 'settings.languages'],
    '/languages/{id}/edit' => ['language', 'languages.edit'],
    '/stocks' => ['stocks', 'stocks'],
    '/product/create' => ['stocks.create', 'stocks.create'],
    '/product/{id}/edit' => ['stocks.edit', 'products.edit'],
    '/category/create' => ['categories.create', 'category.create'],
    '/group/create' => ['groups.create', 'group.create'],
    '/history/patient/{id}' => ['patient-history', 'patients.history'],
    '/setting/payment' => ['setting.payment', 'settings.payment'],
    '/setting/laboratory' => ['setting.laboratory', 'settings.laboratory'],
    '/setting/email' => ['setting.email', 'settings.email'],
    '/setting/colors' => ['setting.colors', 'settings.colors.index'],
    '/setting/license' => ['setting.license', 'settings.license'],
];

foreach (['patients', 'prices', 'categories', 'groups'] as $resource) {
    $indexName = match ($resource) {
        'prices', 'categories', 'groups' => $resource,
        default => $resource.'.index',
    };
    $protectedPages['/'.$resource] = [$resource, $indexName];
    $protectedPages['/'.$resource.'/create'] = [$resource.'.create', $resource.'.create'];
    $protectedPages['/'.$resource.'/{id}/edit'] = [$resource.'.edit', $resource.'.edit'];
    $protectedPages['/'.$resource.'/{id}'] = [
        $resource === 'patients' ? 'patient-history' : $resource.'.edit',
        $resource.'.show',
    ];
}

$guestPages = [
    '/login' => ['auth.login', 'login'],
    '/register' => ['auth.register', 'register'],
    '/forgot-password' => ['auth.forgot-password', 'password.request'],
    '/reset-password/{token}' => ['auth.reset-password', 'password.reset'],
];

$accountPages = [
    '/verify-email' => ['auth.verify-email', 'verification.notice'],
    '/confirm-password' => ['auth.confirm-password', 'password.confirm'],
];

$registerPages = function (array $pages, string|array $action, bool $named = true): void {
    foreach ($pages as $uri => [$screen, $name]) {
        $route = Route::get($uri, $action)->defaults('screen', $screen);
        if ($named) $route->name($name);
    }
};

Route::middleware(['auth', 'verified'])->group(function () use ($registerPages, $protectedPages) {
    $registerPages($protectedPages, LimsPageController::class);
    Route::get('/print/result', fn () => redirect('/results'))->name('results.print');
});

Route::middleware('guest')->group(function () use ($registerPages, $guestPages) {
    $registerPages($guestPages, LimsPageController::class);
});

Route::middleware('auth')->group(function () use ($registerPages, $accountPages) {
    $registerPages($accountPages, LimsPageController::class);
});

// Session-authenticated JSON endpoints consumed by React Router.
Route::prefix('/api/lims')->group(function () use ($registerPages, $protectedPages, $guestPages, $accountPages) {
    Route::middleware(['auth', 'verified'])->group(function () use ($registerPages, $protectedPages) {
        $registerPages($protectedPages, [LimsPageController::class, 'json'], false);
    });
    Route::middleware('guest')->group(function () use ($registerPages, $guestPages) {
        $registerPages($guestPages, [LimsPageController::class, 'json'], false);
    });
    Route::middleware('auth')->group(function () use ($registerPages, $accountPages) {
        $registerPages($accountPages, [LimsPageController::class, 'json'], false);
    });
});
