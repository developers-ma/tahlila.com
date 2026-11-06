<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $page['title'] }} · Tahlila</title>
    @viteReactRefresh
    @vite('resources/js/lims/main.jsx')
</head>
<body>
    <div id="lims"></div>
    <script id="lims-data" type="application/json">{!! json_encode($page, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) !!}</script>
    <noscript>Veuillez activer JavaScript pour utiliser votre laboratoire.</noscript>
</body>
</html>
