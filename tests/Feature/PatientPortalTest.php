<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\PatientAccount;
use App\Models\Price;
use App\Models\Setting;
use App\Models\Test as LaboratoryOrder;
use App\Models\User;
use App\Notifications\PatientPortalResetPassword;
use App\Services\PatientPortalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PatientPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_enable_and_disable_patient_portal(): void
    {
        $admin = User::factory()->create();
        $patient = Patient::create($this->patientData('patient@example.test'));

        $this->get('/patient/login')->assertNotFound();
        $this->actingAs($admin)->post('/setting/patient-portal', [
            'patient_portal_enabled' => 'true',
        ])->assertSessionHasNoErrors()->assertRedirect('/setting/patient-portal');

        $this->assertTrue((bool) Setting::value('patient_portal_enabled'));
        $this->assertDatabaseHas('patient_accounts', ['email' => 'patient@example.test', 'active' => true]);
        $this->get('/patient/login')->assertOk()->assertViewIs('react');

        $this->post('/setting/patient-portal', ['patient_portal_enabled' => 'false'])->assertSessionHasNoErrors();
        $this->get('/patient/login')->assertNotFound();
        $this->getJson('/api/lims/patient/login')->assertNotFound();

        $patient->update(['email' => null]);
        $this->post('/setting/patient-portal', ['patient_portal_enabled' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('patient_accounts', ['patient_id' => $patient->id, 'active' => false]);
    }

    public function test_patient_can_initialize_password_login_and_reset_password(): void
    {
        Notification::fake();
        Setting::first()->update(['patient_portal_enabled' => true]);
        $patient = Patient::create($this->patientData('patient@example.test'));
        $account = app(PatientPortalService::class)->syncPatient($patient);

        $this->post('/patient/forgot-password', ['email' => 'patient@example.test'])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/patient/forgot-password');

        $token = null;
        Notification::assertSentTo($account, PatientPortalResetPassword::class, function (PatientPortalResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        $this->assertNotNull($token);

        $this->post('/patient/reset-password', [
            'email' => 'patient@example.test',
            'token' => $token,
            'password' => 'PatientPass123!',
            'password_confirmation' => 'PatientPass123!',
        ])->assertSessionHasNoErrors()->assertRedirect('/patient/dashboard');

        $this->assertTrue(Hash::check('PatientPass123!', $account->fresh()->password));
        $this->post('/patient/logout')->assertRedirect('/patient/login');
        $this->post('/patient/login', [
            'email' => 'patient@example.test',
            'password' => 'PatientPass123!',
        ])->assertSessionHasNoErrors()->assertRedirect('/patient/dashboard');
        $this->get('/patient/dashboard')->assertOk()->assertViewIs('react');
    }

    public function test_patient_only_sees_own_ready_results(): void
    {
        Setting::first()->update(['patient_portal_enabled' => true]);
        $patient = Patient::create($this->patientData('first@example.test'));
        $otherPatient = Patient::create($this->patientData('second@example.test', 'OTHER-1'));
        $account = PatientAccount::create([
            'patient_id' => $patient->id,
            'email' => $patient->email,
            'password' => 'PatientPass123!',
        ]);
        $price = Price::create([
            'test_name' => 'Glycémie',
            'test_description' => 'À jeun',
            'test_unit' => 'g/L',
            'test_reference_value' => '0.70–1.10',
            'price' => 50,
        ]);
        $ready = $this->order($patient, '3');
        $processing = $this->order($patient, '2');
        $foreign = $this->order($otherPatient, '3');
        $ready->prices()->attach($price, ['test_result_value' => '0.95', 'conclusion' => 'Valeur normale']);
        $foreign->prices()->attach($price, ['test_result_value' => '5.00']);

        $this->withSession(['patient_account_id' => $account->id])
            ->get('/patient/dashboard')
            ->assertOk()
            ->assertViewIs('react')
            ->assertViewHas('page', fn (array $page) => count($page['orders']) === 2 && $page['stats']['ready'] === 1);
        $this->get('/patient/results/'.$ready->id)
            ->assertOk()
            ->assertViewHas('page', fn (array $page) => $page['record']->id === $ready->id && $page['lines']->first()->test_result_value === '0.95');
        $this->get('/patient/results/'.$processing->id)->assertNotFound();
        $this->get('/patient/results/'.$foreign->id)->assertNotFound();
        $this->getJson('/api/lims/patient/results/'.$foreign->id)->assertNotFound();
    }

    public function test_duplicate_patient_email_does_not_create_ambiguous_access(): void
    {
        Setting::first()->update(['patient_portal_enabled' => true]);
        Patient::create($this->patientData('shared@example.test'));
        Patient::create($this->patientData('shared@example.test', 'SECOND-2'));

        $this->assertSame(0, app(PatientPortalService::class)->syncAll());
        $this->assertDatabaseCount('patient_accounts', 0);
    }

    public function test_patient_portal_react_pages_render_without_exposing_other_records(): void
    {
        Setting::first()->update(['patient_portal_enabled' => true]);
        $patient = Patient::create($this->patientData('portal@example.test'));
        $account = PatientAccount::create([
            'patient_id' => $patient->id,
            'email' => $patient->email,
            'password' => 'PatientPass123!',
        ]);
        $price = Price::create([
            'test_name' => 'Hémoglobine',
            'test_description' => 'Dosage',
            'test_unit' => 'g/dL',
            'test_reference_value' => '12–17',
            'price' => 60,
        ]);
        $ready = $this->order($patient, '3');
        $ready->prices()->attach($price, ['test_result_value' => '13.8']);

        $publicPaths = ['/patient/login', '/patient/forgot-password', '/patient/reset-password/test-token?email=portal@example.test'];
        foreach ($publicPaths as $path) {
            $this->capture($this->get($path)->assertOk(), $path);
        }

        $this->withSession(['patient_account_id' => $account->id]);
        foreach (['/patient/dashboard', '/patient/results/'.$ready->id] as $path) {
            $this->capture($this->get($path)->assertOk(), $path);
        }
    }

    private function patientData(string $email, string $idCard = 'PATIENT-1'): array
    {
        return [
            'firstname' => 'Amal',
            'lastname' => 'Patient',
            'id_card' => $idCard,
            'date_of_birth' => '1992-05-10',
            'gender' => '2',
            'phone' => '0600000000',
            'email' => $email,
        ];
    }

    private function order(Patient $patient, string $status): LaboratoryOrder
    {
        return LaboratoryOrder::create([
            'patient_id' => $patient->id,
            'total_price' => 50,
            'paid_amount' => 50,
            'remaining_or_give' => 0,
            'payment_method' => 'cash',
            'test_status' => $status,
        ]);
    }

    private function capture($response, string $path): void
    {
        $response->assertViewIs('react')->assertDontSee('PatientPass123!');
        if ($directory = getenv('LIMS_CAPTURE_DIR')) {
            if (! is_dir($directory)) {
                mkdir($directory, 0700, true);
            }
            file_put_contents($directory.'/'.md5($path).'.json', json_encode($response->viewData('page'), JSON_THROW_ON_ERROR));
        }
    }
}
