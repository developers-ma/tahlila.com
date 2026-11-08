<?php

use App\Http\Controllers\LimsPageController;
use App\Http\Controllers\MedicalCatalogController;
use Illuminate\Support\Facades\Route;

$protectedPages = [
    '/' => ['dashboard', 'dashboard.root', 'dashboard.view'],
    '/dashboard' => ['dashboard', 'dashboard', 'dashboard.view'],
    '/new-test' => ['newtest', 'newtest', 'orders.manage'],
    '/tests/create' => ['order', 'tests.create', 'orders.manage'],
    '/tests/{id}/edit' => ['order', 'tests.edit', 'orders.manage'],
    '/tests/{id}' => ['result', 'tests.show', 'results.manage'],
    '/results' => ['results', 'results', 'results.manage'],
    '/results/{id}/edit' => ['result', 'results.edit', 'results.manage'],
    '/invoices' => ['invoices', 'invoices', 'invoices.manage'],
    '/invoice/{id}' => ['invoice', 'invoice.generateInvoice', 'invoices.manage'],
    '/sample-collection' => ['sample-collection', 'sample-collection', 'collection.manage'],
    '/sample-collection/{id}' => ['barcode', 'sample-collection.show', 'collection.manage'],
    '/print/result/{id}' => ['report', 'results.report', 'results.manage'],
    '/chat' => ['chat', 'chat', 'chat.use'],
    '/staff' => ['staff', 'staff', 'staff.manage'],
    '/staff/create' => ['staff.create', 'staff.create', 'staff.manage'],
    '/staff/{id}/edit' => ['staff.edit', 'staff.edit', 'staff.manage'],
    '/email' => ['email', 'email', 'email.send'],
    '/settings' => ['settings', 'settings', 'settings.manage'],
    '/update' => ['update', 'update', 'settings.manage'],
    '/profile' => ['profile', 'profile.edit', null],
    '/languages' => ['languages', 'settings.languages', 'settings.manage'],
    '/languages/{id}/edit' => ['language', 'languages.edit', 'settings.manage'],
    '/stocks' => ['stocks', 'stocks', 'inventory.manage'],
    '/product/create' => ['stocks.create', 'stocks.create', 'inventory.manage'],
    '/product/{id}/edit' => ['stocks.edit', 'products.edit', 'inventory.manage'],
    '/category/create' => ['categories.create', 'category.create', 'catalog.manage'],
    '/group/create' => ['groups.create', 'group.create', 'catalog.manage'],
    '/history/patient/{id}' => ['patient-history', 'patients.history', 'patients.manage'],
    '/setting/payment' => ['setting.payment', 'settings.payment', 'settings.manage'],
    '/setting/laboratory' => ['setting.laboratory', 'settings.laboratory', 'settings.manage'],
    '/setting/email' => ['setting.email', 'settings.email', 'settings.manage'],
    '/setting/colors' => ['setting.colors', 'settings.colors.index', 'settings.manage'],
    '/setting/patient-portal' => ['setting.patient-portal', 'settings.patient-portal', 'settings.manage'],
    '/setting/medical-catalog' => ['medical-catalog', 'settings.medical-catalog', 'catalog.manage'],
    '/setting/license' => ['setting.license', 'settings.license', 'settings.manage'],
];

foreach (['patients', 'prices', 'categories', 'groups'] as $resource) {
    $indexName = match ($resource) {
        'prices', 'categories', 'groups' => $resource,
        default => $resource.'.index',
    };
    $permission = $resource === 'patients' ? 'patients.manage' : 'catalog.manage';
    $protectedPages['/'.$resource] = [$resource, $indexName, $permission];
    $protectedPages['/'.$resource.'/create'] = [$resource.'.create', $resource.'.create', $permission];
    $protectedPages['/'.$resource.'/{id}/edit'] = [$resource.'.edit', $resource.'.edit', $permission];
    $protectedPages['/'.$resource.'/{id}'] = [
        $resource === 'patients' ? 'patient-history' : $resource.'.edit',
        $resource.'.show',
        $permission,
    ];
}

$guestPages = [
    '/login' => ['auth.login', 'login'],
    '/forgot-password' => ['auth.forgot-password', 'password.request'],
    '/reset-password/{token}' => ['auth.reset-password', 'password.reset'],
    '/two-factor-challenge' => ['auth.two-factor', 'two-factor.login'],
];

// Public staff registration is disabled. Patients initialize their separate
// portal account from the email already verified in their patient record.
Route::get('/register', fn () => redirect('/patient/login'))->name('register');

$accountPages = [
    '/verify-email' => ['auth.verify-email', 'verification.notice'],
    '/confirm-password' => ['auth.confirm-password', 'password.confirm'],
];

$registerPages = function (array $pages, string|array $action, bool $named = true): void {
    foreach ($pages as $uri => $definition) {
        [$screen, $name] = $definition;
        $permission = $definition[2] ?? null;
        $route = Route::get($uri, $action)->defaults('screen', $screen);
        if ($permission) {
            $route->middleware('permission:'.$permission);
        }
        if ($named) {
            $route->name($name);
        }
    }
};

Route::middleware(['auth', 'verified'])->group(function () use ($registerPages, $protectedPages) {
    $registerPages($protectedPages, LimsPageController::class);
    Route::get('/api/medical-catalog', [MedicalCatalogController::class, 'data'])->middleware('permission:catalog.manage');
    Route::post('/api/medical-catalog/install', [MedicalCatalogController::class, 'install'])->middleware('permission:catalog.manage');
    Route::get('/print/result', fn () => redirect('/results'))->middleware('permission:results.manage')->name('results.print');
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
