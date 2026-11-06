<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{

    //add auto nbsp;
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Add auto &nbsp; between words
        Blade::directive('nbsp', function ($expression) {
            return "<?php echo implode('&nbsp;', explode(' ', $expression)); ?>";
});
}

}