<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLimsPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        abort_unless($request->user()?->hasPermission($permission), 403, 'Vous n’avez pas la permission d’accéder à cette fonctionnalité.');

        return $next($request);
    }
}
