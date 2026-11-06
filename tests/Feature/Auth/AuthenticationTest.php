<?php

namespace Tests\Feature\Auth;

use App\Models\Setting;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertViewHas('page', fn (array $page) => $page['patientPortalEnabled'] === false);
    }

    public function test_a_fresh_csrf_token_can_be_requested(): void
    {
        $this->getJson('/csrf-token')
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_an_active_tab_can_refresh_its_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/session/keep-alive')
            ->assertNoContent()
            ->assertHeader('Cache-Control', 'no-store, private');

        $this->assertAuthenticatedAs($user);
        $this->assertIsInt(session('_last_keep_alive'));
    }

    public function test_patient_login_choice_is_exposed_only_when_portal_is_enabled(): void
    {
        $this->get('/login')->assertViewHas('page', fn (array $page) => $page['patientPortalEnabled'] === false);

        Setting::first()->update(['patient_portal_enabled' => true]);

        $this->get('/login')->assertViewHas('page', fn (array $page) => $page['patientPortalEnabled'] === true);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(RouteServiceProvider::HOME);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHas('success');
    }
}
