<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ColorSetting;
use App\Models\EmailSetting;
use App\Models\Group;
use App\Models\LaboratorySetting;
use App\Models\Patient;
use App\Models\Price;
use App\Models\Stock;
use App\Models\Test as Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class LimsWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function fixtures(): array
    {
        $this->actingAs(User::factory()->create());
        $patient = Patient::create(['firstname' => 'Test', 'lastname' => 'Patient', 'id_card' => 'TEST-1', 'date_of_birth' => '1990-01-01', 'gender' => 'Male', 'phone' => '0600000000']);
        $price = Price::create(['test_name' => 'Glycémie', 'test_description' => 'À jeun', 'test_unit' => 'g/L', 'test_reference_value' => '0.70–1.10', 'price' => 50]);

        return [$patient, $price];
    }

    public function test_every_existing_page_renders_react_without_exposing_passwords(): void
    {
        [$patient, $price] = $this->fixtures();
        $category = Category::create(['category_name' => 'Biochimie']);
        $group = Group::create(['group_name' => 'Bilan']);
        $stock = Stock::create(['product_name' => 'Tube', 'product_color' => '#00ff00', 'quantity' => 10]);
        $order = Order::create(['patient_id' => $patient->id, 'total_price' => 50, 'paid_amount' => 0, 'remaining_or_give' => 50, 'payment_method' => 'cash', 'test_status' => '1']);
        $order->prices()->attach($price);
        LaboratorySetting::firstOrFail()->update(['logo' => 'logos/laboratory.png']);
        EmailSetting::first()->update(['mail_password' => 'must-never-reach-react']);
        $staffMember = User::factory()->create();
        $paths = ['/', '/dashboard', '/new-test', '/patients', '/patients/create', "/patients/$patient->id/edit", "/patients/$patient->id", '/prices', '/prices/create', "/prices/$price->id/edit", '/categories', '/categories/create', '/category/create', "/categories/$category->id/edit", '/groups', '/groups/create', '/group/create', "/groups/$group->id/edit", '/stocks', '/product/create', "/product/$stock->id/edit", '/tests/create', "/tests/$order->id/edit", "/tests/$order->id", '/results', "/results/$order->id/edit", '/invoices', "/invoice/$order->id", '/sample-collection', "/sample-collection/$order->id", "/print/result/$order->id", '/chat', '/staff', '/staff/create', "/staff/$staffMember->id/edit", '/email', '/settings', '/setting/laboratory', '/setting/payment', '/setting/email', '/setting/colors', '/setting/patient-portal', '/setting/license', '/languages', '/languages/en/edit', '/update', '/profile'];
        foreach ($paths as $path) {
            $response = $this->get($path);
            $response->assertOk()->assertViewIs('react')->assertSee('id="lims"', false)->assertDontSee('must-never-reach-react');
            if ($directory = getenv('LIMS_CAPTURE_DIR')) {
                if (! is_dir($directory)) {
                    mkdir($directory, 0700, true);
                }
                file_put_contents($directory.'/'.md5($path).'.json', json_encode($response->viewData('page'), JSON_THROW_ON_ERROR));
            }
        }
        $this->get('/history/patient/'.$patient->id)->assertOk()->assertViewIs('react');
        $this->get('/print/result')->assertRedirect('/results');
    }

    public function test_order_amounts_are_calculated_on_server_and_kept_results_survive_editing(): void
    {
        [$patient, $price] = $this->fixtures();
        $data = ['patient_id' => $patient->id, 'tests' => [$price->id.'*null*null'], 'paid_amount' => 10, 'payment_method' => 'cash', 'test_status' => '1', 'total_price' => 1, 'remaining_or_give' => -999];
        $this->post('/tests/create', $data)->assertSessionHasNoErrors()->assertRedirect();
        $order = Order::firstOrFail();
        $this->assertSame('50.00', $order->total_price);
        $this->assertSame('40.00', $order->remaining_or_give);
        $pivot = DB::table('test_for_patients')->first();
        $this->put('/results/'.$pivot->id, ['test_result_value' => '0.95', 'conclusion' => 'Conservée'])->assertSessionHasNoErrors();
        unset($data['tests']);
        $data['modifieds'] = [$pivot->id];
        $data['paid_amount'] = 20;
        $this->put('/tests/'.$order->id.'/edit', $data)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('test_for_patients', ['id' => $pivot->id, 'test_result_value' => '0.95', 'conclusion' => 'Conservée']);
        $this->assertSame('30.00', $order->fresh()->remaining_or_give);
        $this->put('/invoices/'.$order->id, ['remaining_or_give' => 0, 'patient_id' => 999, 'total_price' => 1])->assertSessionHasNoErrors();
        $this->assertSame('50.00', $order->fresh()->total_price);
        $this->assertSame('50.00', $order->fresh()->paid_amount);
        $this->assertEquals($patient->id, $order->fresh()->patient_id);
    }

    public function test_invalid_selection_cannot_create_partial_order(): void
    {
        [$patient, $price] = $this->fixtures();
        $this->post('/tests/create', ['patient_id' => $patient->id, 'tests' => [$price->id.'*999*null'], 'paid_amount' => 0, 'payment_method' => 'cash', 'test_status' => '1'])->assertSessionHasErrors('tests');
        $this->assertDatabaseCount('tests', 0);
        $this->assertDatabaseCount('test_for_patients', 0);
    }

    public function test_guest_cannot_access_laboratory_data(): void
    {
        foreach (['/patients', '/sample-collection', '/results', '/setting/email'] as $path) {
            $this->get($path)->assertRedirect('/login');
        }
        $this->post('/patients/search', ['q' => 'Test'])->assertRedirect('/login');
        foreach (['/login', '/forgot-password', '/reset-password/test-token?email=test@example.test'] as $path) {
            $response = $this->get($path)->assertOk()->assertViewIs('react');
            if ($directory = getenv('LIMS_CAPTURE_DIR')) {
                if (! is_dir($directory)) {
                    mkdir($directory, 0700, true);
                }
                file_put_contents($directory.'/'.md5($path).'.json', json_encode($response->viewData('page'), JSON_THROW_ON_ERROR));
            }
        }
    }

    public function test_react_router_json_api_returns_page_data_and_protects_laboratory_records(): void
    {
        $this->getJson('/api/lims/patients')->assertUnauthorized();
        $this->getJson('/api/lims/login')
            ->assertOk()
            ->assertJsonPath('screen', 'auth.login')
            ->assertJsonMissingPath('laboratory.mail_password');

        [$patient] = $this->fixtures();
        foreach (range(1, 20) as $number) {
            Patient::create([
                'firstname' => 'Patient',
                'lastname' => 'API '.$number,
                'id_card' => 'API-'.$number,
                'date_of_birth' => '1990-01-01',
                'gender' => '1',
                'phone' => '060000'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
            ]);
        }
        $this->getJson('/api/lims/patients?q=Test')
            ->assertOk()
            ->assertJsonPath('screen', 'patients')
            ->assertJsonPath('rows.data.0.id', $patient->id)
            ->assertJsonPath('path', '/patients');
        $this->getJson('/api/lims/patients')
            ->assertOk()
            ->assertJsonPath('rows.current_page', 1)
            ->assertJsonPath('rows.next_page_url', '/patients?page=2');
        $this->getJson('/api/lims/tests/create')
            ->assertOk()
            ->assertJsonPath('screen', 'patient-select')
            ->assertJsonFragment([
                'id' => $patient->id,
                'firstname' => $patient->firstname,
                'lastname' => $patient->lastname,
            ]);
        $this->getJson('/api/lims/tests/create?patient='.$patient->id)
            ->assertOk()
            ->assertJsonPath('screen', 'order')
            ->assertJsonPath('selectedPatient', (string) $patient->id);
    }

    public function test_json_form_submission_can_follow_redirect_to_the_next_react_page(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this
            ->followingRedirects()
            ->withHeaders(['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'])
            ->post('/patients', [
                'firstname' => 'API',
                'lastname' => 'Patient',
                'gender' => '2',
                'date_of_birth' => '1995-01-01',
                'id_card' => 'API-1',
                'phone' => '0600000000',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('screen', 'order')
            ->assertJsonPath('selectedPatient', '1');
    }

    public function test_catalogue_group_and_category_selections_are_saved_and_used_prices_are_protected(): void
    {
        [$patient, $price] = $this->fixtures();
        $this->post('/categories', ['category_name' => 'Biochimie'])->assertSessionHasNoErrors();
        $this->post('/groups', ['group_name' => 'Bilan'])->assertSessionHasNoErrors();
        $category = Category::first();
        $group = Group::first();
        $this->put('/prices/'.$price->id, ['test_name' => 'Glycémie', 'test_description' => 'À jeun', 'test_unit' => 'g/L', 'test_reference_value' => '0.7–1.1', 'price' => 70, 'groups' => [$group->id], 'categories' => [$category->id]])->assertSessionHasNoErrors();
        $this->post('/tests', ['patient_id' => $patient->id, 'tests' => [$price->id.'*'.$group->id.'*'.$category->id], 'paid_amount' => 0, 'payment_method' => 'cash', 'test_status' => '0'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('test_for_patients', ['price_id' => $price->id, 'group_id' => $group->id, 'category_id' => $category->id]);
        $this->delete('/prices/'.$price->id)->assertSessionHas('error');
        $this->assertNotNull($price->fresh());
    }

    public function test_patient_stock_payment_and_email_settings_forms_keep_their_backend_contracts(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post('/patients', ['firstname' => 'Lina', 'lastname' => 'Test', 'gender' => '2', 'date_of_birth' => '1995-01-01', 'id_card' => 'TEST-2', 'phone' => '0600000000'])->assertSessionHasNoErrors()->assertRedirect('/tests/create?patient=1');
        $this->post('/product/create', ['product_name' => 'Tube', 'product_color' => '#ffaabb', 'quantity' => 100])->assertSessionHasNoErrors();
        $stock = Stock::first();
        $this->put('/product/'.$stock->id.'/edit', ['product_name' => 'Tube', 'product_color' => '#ffaabb', 'quantity' => 100, 'quantity_used' => 10])->assertSessionHasNoErrors();
        $this->assertEquals(10, $stock->fresh()->quantity_used);
        $this->assertSame('#ffaabb', $stock->fresh()->product_color);
        $this->put('/product/'.$stock->id.'/edit', ['product_name' => 'Tube', 'product_color' => 'red', 'quantity' => 100, 'quantity_used' => 10])
            ->assertSessionHasErrors('product_color');
        $this->assertSame('#ffaabb', $stock->fresh()->product_color);
        $this->post('/setting/payment', ['cash' => 'true', 'pos' => 'false', 'currency' => 'MAD', 'tax' => 20])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('payment_methods', ['cash' => 'true', 'pos' => 'false', 'cheque' => 'false']);
        EmailSetting::first()->update(['mail_password' => 'saved-secret']);
        $this->post('/setting/email', ['mail_host' => 'smtp.example.test', 'mail_port' => '587', 'mail_username' => 'test', 'mail_password' => '', 'mail_encryption' => 'tls', 'mail_from_address' => 'lab@example.test', 'mail_from_name' => 'Laboratoire', 'imap_host' => 'imap.example.test', 'imap_port' => 993, 'imap_encryption' => 'ssl', 'imap_username' => 'test', 'imap_password' => 'imap-secret', 'imap_validate_cert' => '1', 'send_email' => 'false'])->assertSessionHasNoErrors();
        $this->assertSame('saved-secret', EmailSetting::first()->mail_password);
        $this->assertSame('false', EmailSetting::first()->email_notification);
        $this->assertSame('imap.example.test', EmailSetting::first()->imap_host);
        $this->assertTrue(EmailSetting::first()->mailboxConfigured());

        ColorSetting::first()->update(['primary_color' => '#abcdef', 'error_color' => '#123456']);
        $this->post('/setting/colors/reset')
            ->assertSessionHasNoErrors()
            ->assertRedirect('/setting/colors');
        $this->assertSame(ColorSetting::DEFAULTS, ColorSetting::first()->only(array_keys(ColorSetting::DEFAULTS)));
    }

    public function test_email_setup_can_detect_and_save_a_provider_automatically(): void
    {
        $this->actingAs(User::factory()->create());

        $this->postJson('/setting/email/automatic', [
            'email' => 'laboratory@gmail.com',
            'password' => 'application-password',
            'from_name' => 'Laboratoire Tahlila',
            'redirect' => '/setting/email',
        ])->assertOk()
            ->assertJsonPath('provider', 'Google / Gmail')
            ->assertJsonPath('smtp', 'smtp.gmail.com:587')
            ->assertJsonPath('imap', 'imap.gmail.com:993')
            ->assertJsonPath('redirect', '/setting/email')
            ->assertJsonMissing(['password' => 'application-password']);

        $settings = EmailSetting::firstOrFail();
        $this->assertSame('smtp.gmail.com', $settings->mail_host);
        $this->assertSame('imap.gmail.com', $settings->imap_host);
        $this->assertSame('laboratory@gmail.com', $settings->mail_username);
        $this->assertSame('application-password', $settings->mail_password);
        $this->assertTrue($settings->mailboxConfigured());
    }

    public function test_professional_email_uses_the_certificate_safe_mail_hostname(): void
    {
        $configuration = app(\App\Services\EmailConfigurationDiscoveryService::class)
            ->discover('contact@professional-domain.invalid');

        $this->assertSame('mail.professional-domain.invalid', $configuration['smtpHost']);
        $this->assertSame('mail.professional-domain.invalid', $configuration['imapHost']);
        $this->assertSame(587, $configuration['smtpPort']);
        $this->assertSame(993, $configuration['imapPort']);
    }

    public function test_patient_insurance_and_child_parent_identity_are_saved(): void
    {
        $this->actingAs(User::factory()->create());
        $child = [
            'firstname' => 'Aya',
            'lastname' => 'Test',
            'gender' => '2',
            'date_of_birth' => '2018-05-10',
            'phone' => '0600000000',
            'is_child' => '1',
            'has_insurance' => '1',
            'parent_id_card' => 'CD480000',
        ];

        $this->post('/patients', $child)->assertSessionHasNoErrors();
        $this->post('/patients', [...$child, 'firstname' => 'Adam'])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('patients', [
            'firstname' => 'Aya',
            'id_card' => 'child/1/CD480000',
            'parent_id_card' => 'CD480000',
            'child_number' => 1,
            'is_child' => 1,
            'has_insurance' => 1,
        ]);
        $this->assertDatabaseHas('patients', [
            'firstname' => 'Adam',
            'id_card' => 'child/2/CD480000',
            'child_number' => 2,
        ]);

        $firstChild = Patient::where('firstname', 'Aya')->firstOrFail();
        $this->put('/patients/'.$firstChild->id, $child)->assertSessionHasNoErrors();
        $this->assertSame('child/1/CD480000', $firstChild->fresh()->id_card);
    }

    public function test_results_from_another_order_cannot_be_retained_in_an_edit(): void
    {
        [$patient, $price] = $this->fixtures();
        $data = ['patient_id' => $patient->id, 'tests' => [$price->id.'*null*null'], 'paid_amount' => 0, 'payment_method' => 'cash', 'test_status' => '1'];
        $this->post('/tests', $data)->assertSessionHasNoErrors();
        $first = Order::first();
        $foreignLine = DB::table('test_for_patients')->first();
        $this->post('/tests', $data)->assertSessionHasNoErrors();
        $second = Order::latest('id')->first();
        unset($data['tests']);
        $data['modifieds'] = [$foreignLine->id];
        $this->put('/tests/'.$second->id, $data)->assertSessionHasErrors('modifieds.0');
        $this->assertDatabaseCount('test_for_patients', 2);
        $this->assertDatabaseHas('test_for_patients', ['id' => $foreignLine->id, 'test_id' => $first->id]);
    }

    public function test_barcode_print_settings_are_saved_for_the_next_print(): void
    {
        [$patient, $price] = $this->fixtures();
        $order = Order::create([
            'patient_id' => $patient->id,
            'total_price' => 50,
            'paid_amount' => 0,
            'remaining_or_give' => 50,
            'payment_method' => 'cash',
            'test_status' => '1',
        ]);
        $order->prices()->attach($price);

        $this->postJson('/sample-collection/'.$order->id.'/print-settings', [
            'tube_copies' => ['standard' => 2, '7' => 3],
            'tube_label_format' => '50x30',
        ])->assertOk()
            ->assertJsonPath('tube_label_format', '50x30')
            ->assertJsonPath('prelevement_date', now()->toDateString());

        $saved = $order->fresh();
        $this->assertSame(['standard' => 2, '7' => 3], $saved->tube_copies);
        $this->assertSame('50x30', $saved->tube_label_format);
        $this->assertSame(now()->toDateString(), $saved->prelevement_date?->toDateString());

        $differentDate = now()->addDay()->toDateString();
        $this->postJson('/sample-collection/'.$order->id.'/print-settings', [
            'tube_copies' => ['standard' => 1],
            'tube_label_format' => '50x25',
            'prelevement_date' => $differentDate,
        ])->assertUnprocessable()->assertJsonValidationErrors('prelevement_date');

        $this->putJson('/sample-collection/'.$order->id, [
            'test_status' => '2',
            'prelevement_date' => $differentDate,
        ])->assertUnprocessable()->assertJsonValidationErrors('prelevement_date');

        $this->assertSame(
            now()->toDateString(),
            $order->fresh()->prelevement_date?->toDateString(),
        );
    }

    public function test_laboratory_logo_upload_is_saved_to_the_public_disk(): void
    {
        $this->actingAs(User::factory()->create());
        Storage::fake('public');

        $response = $this->post('/laboratory-settings', [
            'laboratory_name' => 'Laboratoire Tahlila',
            'managing_director' => 'Responsable',
            'phone' => '0612345678',
            'fax' => '',
            'email' => 'contact@tahlila.test',
            'address' => 'Fès',
            'company_number' => 'RC-123',
            'tax_id' => 'IF-123',
            'logo' => UploadedFile::fake()->image('laboratory-logo.png'),
            'footer_title1' => 'Laboratoire Tahlila',
            'footer_title2' => '0612345678',
            'footer_title3' => 'Fès, Maroc',
        ]);

        $response->assertSessionHasNoErrors()->assertRedirect('/setting/laboratory');
        $logo = LaboratorySetting::firstOrFail()->fresh()->logo;

        $this->assertNotEmpty($logo);
        Storage::disk('public')->assertExists($logo);
        $this->assertStringContainsString('/storage/', LaboratorySetting::first()->logo_url);
    }
}
