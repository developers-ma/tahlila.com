<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TotpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_enable_confirm_and_use_two_factor_authentication(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/profile/two-factor/enable', ['password' => 'password'])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_confirmed_at);

        $code = app(TotpService::class)->code($user->two_factor_secret);
        $this->post('/profile/two-factor/confirm', ['code' => $code])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('two_factor_recovery_codes');

        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
        $this->post('/logout');

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/two-factor-challenge');
        $this->assertGuest();

        $this->post('/two-factor-challenge', ['code' => '000000'])
            ->assertSessionHasErrors('code');
        $this->assertGuest();

        $code = app(TotpService::class)->code($user->two_factor_secret);
        $this->post('/two-factor-challenge', ['code' => $code])
            ->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_can_disable_two_factor_authentication_with_password(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'two_factor_secret' => app(TotpService::class)->generateSecret(),
            'two_factor_recovery_codes' => [],
            'two_factor_confirmed_at' => now(),
        ])->save();

        $this->actingAs($user)
            ->delete('/profile/two-factor', ['password' => 'password'])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_confirmed_at);
    }
}
