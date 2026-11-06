<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_redirects_to_patient_portal(): void
    {
        $this->get('/register')->assertRedirect('/patient/login');
    }

    public function test_public_registration_cannot_create_staff_users(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertStatus(405);

        $this->assertGuest();
        $this->assertDatabaseMissing(User::class, ['email' => 'test@example.com']);
    }
}
