<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #18311f; font-size: 12px; }
        header { border-bottom: 3px solid #18311f; padding-bottom: 14px; margin-bottom: 20px; }
        h1 { margin: 0 0 4px; font-size: 22px; } h2 { margin: 22px 0 8px; font-size: 15px; }
        .muted { color: #71816f; } .patient { background: #f1f6ed; padding: 12px; }
        .result { border-bottom: 1px solid #dce5d8; padding: 13px 0; }
        .value { font-size: 15px; font-weight: bold; } .reference { color: #71816f; float: right; }
        footer { margin-top: 28px; border-top: 1px solid #dce5d8; padding-top: 12px; text-align: center; color: #71816f; }
    </style>
</head>
<body>
    <header>
        <h1>{{ $laboratory?->laboratory_name ?? config('app.name', 'Tahlila') }}</h1>
        <div class="muted">Compte rendu d’analyses · Dossier #{{ $test->id }}</div>
    </header>
    <div class="patient">
        <strong>Patient :</strong> {{ $test->patient?->firstname }} {{ $test->patient?->lastname }}<br>
        <span class="muted">Date du dossier : {{ optional($test->created_at)->format('d/m/Y') }}</span>
    </div>
    <h2>Résultats</h2>
    @foreach ($lines as $line)
        <div class="result">
            <strong>{{ $line->test_name }}</strong>
            @if ($line->test_result_value)
                <span class="reference">Référence : {{ $line->test_reference_value ?: '—' }}</span>
                <div class="value">{{ $line->test_result_value }} {{ $line->test_unit }}</div>
            @else
                <div class="muted">Résultat non renseigné</div>
            @endif
        </div>
    @endforeach
    <footer>Document généré par Tahlila · Merci pour votre confiance.</footer>
</body>
</html>
