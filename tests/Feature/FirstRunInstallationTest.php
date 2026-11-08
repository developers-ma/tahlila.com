<?php

namespace Tests\Feature;

use App\Models\{ApplicationInstallation,Role,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FirstRunInstallationTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_run_creates_and_logs_in_the_only_administrator(): void
    {
        $this->get('/install/account')->assertOk()->assertSee('id="installer"', false);
        $response=$this->postJson('/install/account',[
            'name'=>'Biologiste responsable','email'=>'admin@laboratoire.ma','email_confirmation'=>'admin@laboratoire.ma',
            'password'=>'SecureLab2026','password_confirmation'=>'SecureLab2026',
        ]);
        $response->assertOk()->assertJsonPath('redirect','/install/setup');
        $user=User::sole();
        $this->assertAuthenticatedAs($user);
        $this->assertSame('administrator',$user->role->slug);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('laboratory',ApplicationInstallation::find(1)->current_step);
        $this->assertDatabaseCount('laboratory_settings',0);
        $this->assertGreaterThan(150,\App\Models\MedicalTest::count());
        $this->get('/install/setup')->assertOk()->assertSee('id="installer"', false);
    }

    public function test_email_confirmation_is_required_and_second_admin_cannot_be_bootstrapped(): void
    {
        $payload=['name'=>'Admin','email'=>'admin@lab.ma','email_confirmation'=>'different@lab.ma','password'=>'SecureLab2026','password_confirmation'=>'SecureLab2026'];
        $this->postJson('/install/account',$payload)->assertUnprocessable()->assertJsonValidationErrors('email');
        User::factory()->create(['role_id'=>Role::where('slug','administrator')->value('id')]);
        $payload['email_confirmation']=$payload['email'];
        $this->postJson('/install/account',$payload)->assertConflict();
    }

    public function test_first_run_catalogue_installs_operational_tests_and_prices(): void
    {
        $this->postJson('/install/account',['name'=>'Admin','email'=>'admin@lab.ma','email_confirmation'=>'admin@lab.ma','password'=>'SecureLab2026','password_confirmation'=>'SecureLab2026'])->assertOk();
        $this->postJson('/install/laboratory',[
            'laboratory_name'=>'Laboratoire Test','managing_director'=>'Dr Test','phone'=>'0600000000','fax'=>'','email'=>'contact@lab.ma','address'=>'Casablanca',
            'company_number'=>'RC123','tax_id'=>'IF123','footer_title1'=>'Laboratoire Test','footer_title2'=>'0600000000','footer_title3'=>'Casablanca',
        ])->assertOk();
        $this->postJson('/install/preferences',['language'=>'fr','currency'=>'MAD','tax'=>20])->assertOk();
        $test=\App\Models\MedicalTest::where('code','GLU')->firstOrFail();
        $this->postJson('/api/medical-catalog/install',[
            'installation_id'=>(string) \Illuminate\Support\Str::uuid(),'test_ids'=>[$test->id],'group_ids'=>[],
            'prices'=>[$test->id=>35],'group_prices'=>[],'effective_from'=>'2026-11-08',
        ])->assertOk();

        $this->assertDatabaseHas('laboratory_tests',['medical_test_id'=>$test->id,'is_active'=>1]);
        $this->assertDatabaseHas('prices',['medical_test_id'=>$test->id,'price'=>35]);
        $this->postJson('/install/complete')->assertOk()->assertJsonPath('redirect','/dashboard');
    }
}
