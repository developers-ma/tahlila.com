@php
    $status = (int) ($status ?? 500);
    $copy = match ($status) {
        401 => [__('Authentication required'), __('Please sign in to continue.')],
        403 => [__('Access denied'), __('You do not have permission to view this page.')],
        404 => [__('Page not found'), __('The page you requested does not exist or has moved.')],
        405 => [__('Action not allowed'), __('This request method is not supported for this page.')],
        419 => [__('Session expired'), __('Refresh the page and try again.')],
        429 => [__('Too many requests'), __('Please wait a moment before trying again.')],
        503 => [__('Service unavailable'), __('The application is temporarily unavailable.')],
        default => $status >= 500
            ? [__('Something went wrong'), __('An unexpected error occurred. Please try again.')]
            : [__('Request error'), __('The request could not be completed.')],
    };
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $status }} · {{ $copy[0] }} · Tahlila</title>
    <style>
        *{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17351c;background:#f5f9f1}body{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 10% 10%,#e7f7d8 0,transparent 28%),radial-gradient(circle at 90% 90%,#dff3cb 0,transparent 25%),#f7faf4}.error-shell{width:min(100%,720px);padding:clamp(28px,6vw,64px);text-align:center;border:1px solid #dce7d5;border-radius:30px;background:rgba(255,255,255,.94);box-shadow:0 28px 80px rgba(28,67,28,.1)}.brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:38px;color:#165514;text-decoration:none}.brand svg{width:31px;height:31px}.brand b{font-size:30px;letter-spacing:-1.7px;line-height:1}.brand small{display:block;margin-top:6px;font-size:9px;font-weight:600;letter-spacing:1.4px}.code{display:block;color:#57a91d;font-size:clamp(76px,18vw,150px);font-weight:900;line-height:.8;letter-spacing:-.08em}.error-shell h1{margin:30px 0 10px;font-size:clamp(25px,5vw,39px);letter-spacing:-.04em}.error-shell p{max-width:480px;margin:0 auto;color:#687867;font-size:14px;line-height:1.7}.actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:30px}.actions a,.actions button{min-height:46px;display:inline-flex;align-items:center;justify-content:center;padding:0 20px;border:1px solid #d5dfcf;border-radius:12px;color:#335032;background:#fff;font:inherit;font-size:13px;font-weight:800;text-decoration:none;cursor:pointer}.actions .primary{border-color:#155c12;color:#fff;background:linear-gradient(135deg,#155b0e,#0e7412)}@media(max-width:520px){body{padding:12px}.error-shell{padding:28px 20px;border-radius:20px}.brand{margin-bottom:32px}.code{font-size:88px}.actions{display:grid}.actions a,.actions button{width:100%}}
    </style>
</head>
<body>
    <main class="error-shell">
        <a class="brand" href="{{ url('/') }}" aria-label="Tahlila">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"/><path d="M10 9V3h4v6l5 9a2 2 0 0 1-1.7 3H6.7A2 2 0 0 1 5 18Z"/><path d="M7 15h10"/></svg>
            <b>tahlila<small>lab workspace</small></b>
        </a>
        <span class="code">{{ $status }}</span>
        <h1>{{ $copy[0] }}</h1>
        <p>{{ $copy[1] }}</p>
        <div class="actions">
            <button type="button" onclick="history.length > 1 ? history.back() : location.assign('/')">{{ __('Go back') }}</button>
            <a class="primary" href="{{ url('/') }}">{{ __('Go to home') }}</a>
        </div>
    </main>
</body>
</html>
