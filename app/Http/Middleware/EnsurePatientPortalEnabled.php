<?php

namespace App\Http\Middleware;

use App\Services\PatientPortalService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePatientPortalEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(app(PatientPortalService::class)->enabled(), 404);

        return $next($request);
    }
}
