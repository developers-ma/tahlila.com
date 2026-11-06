<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;

class SetDefaultLanguage
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

         // Avoid querying a table that may not exist during installation or migrations.
         $defaultLanguage = DB::getSchemaBuilder()->hasTable('settings')
             ? DB::table('settings')->value('default_language')
             : null;

         // Set the default language for the application
         App::setLocale($defaultLanguage ?: config('app.locale', 'en'));
 
         return $next($request);
    }
}
