<?php

namespace App\Http\Controllers;

use App\Models\ColorSetting;
use App\Models\LaboratorySetting;
use App\Models\PatientAccount;
use App\Models\PaymentMethod;
use App\Models\Test;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class PatientPortalController extends Controller
{
    public function __invoke(Request $request): Response|JsonResponse
    {
        $page = $this->data($request, (string) $request->route('screen'), $request->route('id'));

        if ($request->expectsJson()) {
            return response()->json($page)->header('Cache-Control', 'private, no-store');
        }

        return response()->view('react', compact('page'))->header('Cache-Control', 'private, no-store');
    }

    private function data(Request $request, string $screen, mixed $id): array
    {
        $locale = app()->getLocale();
        $dictionaryPath = preg_match('/^[a-zA-Z-]+$/', $locale) ? base_path("lang/$locale.json") : '';
        $path = preg_replace('#^api/lims#', '', $request->path());
        $page = [
            'screen' => $screen,
            'locale' => $locale,
            'dictionary' => $dictionaryPath && File::exists($dictionaryPath) ? json_decode(File::get($dictionaryPath), true) : [],
            'title' => 'Espace patient',
            'csrf' => csrf_token(),
            'errors' => collect(session('errors')?->getBags() ?? [])->flatMap(fn ($bag) => $bag->toArray())->all(),
            'old' => collect($request->old())->except(['password', 'password_confirmation', '_token'])->all(),
            'flash' => session('success') ?? session('status') ?? session('error'),
            'currency' => PaymentMethod::value('currency') ?: 'MAD',
            'laboratory' => LaboratorySetting::first(),
            'theme' => ColorSetting::whereColumn('updated_at', '!=', 'created_at')->first(),
            'path' => '/'.ltrim($path ?: '/', '/'),
        ];

        if (in_array($screen, ['patient.login', 'patient.forgot-password', 'patient.reset-password'], true)) {
            $page['token'] = $request->route('token');
            $page['email'] = $request->query('email');

            return $page;
        }

        /** @var PatientAccount $account */
        $account = $request->attributes->get('patientAccount');
        $patient = $account->patient;
        $page['patient'] = $patient->only('id', 'firstname', 'lastname', 'id_card', 'date_of_birth', 'gender', 'phone', 'email');
        $page['account'] = $account->only('email', 'last_login_at');

        if ($screen === 'patient.dashboard') {
            $orders = Test::where('patient_id', $patient->id)->latest('id')->get([
                'id', 'total_price', 'paid_amount', 'remaining_or_give', 'test_status', 'prelevement_date', 'created_at',
            ]);
            $page['orders'] = $orders->map(function (Test $order): Test {
                $order->test_status = match ((string) $order->test_status) {
                    'completed' => '3',
                    'in treatment' => '2',
                    'not yet screened' => '1',
                    default => (string) $order->test_status,
                };

                return $order;
            });
            $page['stats'] = [
                'orders' => $orders->count(),
                'ready' => $page['orders']->where('test_status', '3')->count(),
                'processing' => $page['orders']->whereIn('test_status', ['1', '2'])->count(),
            ];
        } elseif ($screen === 'patient.result') {
            $test = Test::where('patient_id', $patient->id)->whereIn('test_status', ['3', 'completed'])->findOrFail($id);
            $page['title'] = 'Résultats du dossier #'.$test->id;
            $page['record'] = $test;
            $page['lines'] = DB::table('test_for_patients as lines')
                ->leftJoin('prices', 'prices.id', '=', 'lines.price_id')
                ->leftJoin('groups', 'groups.id', '=', 'lines.group_id')
                ->leftJoin('categories', 'categories.id', '=', 'lines.category_id')
                ->where('lines.test_id', $test->id)
                ->select('prices.test_name', 'prices.test_unit', 'prices.test_unit_2', 'prices.test_reference_value', 'prices.test_reference_value_2', 'lines.test_result_value', 'lines.test_result_value_2', 'lines.conclusion', 'groups.group_name', 'categories.category_name')
                ->get();
        } else {
            abort(404);
        }

        return $page;
    }
}
