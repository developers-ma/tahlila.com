<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PermissionSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_roles_and_individual_permissions_protect_pages_and_json_api(): void
    {
        $reception = Role::where('slug', 'reception')->firstOrFail();
        $user = User::factory()->create(['role_id' => $reception->id, 'permissions' => null]);

        $this->actingAs($user)->get('/patients')->assertOk();
        $this->getJson('/api/lims/invoices')->assertOk();
        foreach (['/staff', '/settings', '/prices', '/results'] as $path) {
            $this->get($path)->assertForbidden();
        }

        $user->update(['permissions' => ['catalog.manage']]);
        $this->get('/prices')->assertOk();
        $this->getJson('/api/lims/prices')->assertOk();
    }

    public function test_administrator_can_freely_customize_non_admin_permissions(): void
    {
        $administrator = Role::where('slug', 'administrator')->firstOrFail();
        $laboratory = Role::where('slug', 'laboratory')->firstOrFail();
        $admin = User::factory()->create(['role_id' => $administrator->id]);

        $this->actingAs($admin)->post('/staff', [
            'name' => 'Biologiste Test',
            'email' => 'biologiste@example.test',
            'role_id' => $laboratory->id,
            'permissions' => ['invoices.manage'],
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ])->assertSessionHasNoErrors()->assertRedirect('/staff');

        $member = User::where('email', 'biologiste@example.test')->firstOrFail();
        $this->assertSame($laboratory->id, $member->role_id);
        $this->assertSame(['invoices.manage'], $member->permissions);
        $this->assertTrue(Hash::check('SecurePass123!', $member->password));
        $this->assertFalse($member->hasPermission('results.manage'));
        $this->assertTrue($member->hasPermission('invoices.manage'));
        $this->assertFalse($member->hasPermission('staff.manage'));
    }

    public function test_administrator_role_always_has_complete_access(): void
    {
        $administrator = Role::where('slug', 'administrator')->firstOrFail();
        $admin = User::factory()->create(['role_id' => $administrator->id]);

        $this->actingAs($admin)->post('/staff', [
            'name' => 'Nouvel Administrateur',
            'email' => 'new-admin@example.test',
            'role_id' => $administrator->id,
            'permissions' => ['dashboard.view'],
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ])->assertSessionHasNoErrors()->assertRedirect('/staff');

        $member = User::where('email', 'new-admin@example.test')->firstOrFail();
        $this->assertNull($member->permissions);
        $this->assertTrue($member->hasPermission('staff.manage'));
        $this->assertTrue($member->hasPermission('settings.manage'));
    }

    public function test_last_administrator_and_own_account_are_protected(): void
    {
        $administrator = Role::where('slug', 'administrator')->firstOrFail();
        $reception = Role::where('slug', 'reception')->firstOrFail();
        $admin = User::factory()->create(['role_id' => $administrator->id]);

        $this->actingAs($admin)->put('/staff/'.$admin->id, [
            'name' => $admin->name,
            'email' => $admin->email,
            'role_id' => $reception->id,
            'permissions' => [],
            'password' => '',
            'password_confirmation' => '',
        ])->assertSessionHasErrors('role_id');

        $this->delete('/staff/'.$admin->id)->assertSessionHasErrors('user');
        $this->assertNotNull($admin->fresh());
    }

    public function test_every_verified_lims_page_is_registered_with_a_permission(): void
    {
        $known = array_keys(config('lims_permissions.permissions'));

        foreach (config('lims_permissions.roles') as $role) {
            foreach (array_diff($role['permissions'], ['*']) as $permission) {
                $this->assertContains($permission, $known);
            }
        }

        foreach (Route::getRoutes() as $route) {
            $middleware = $route->gatherMiddleware();
            if (! in_array('verified', $middleware, true) || str_ends_with($route->uri(), 'profile')) {
                continue;
            }

            $permissionMiddleware = collect($middleware)->first(
                fn (string $item) => str_starts_with($item, 'permission:'),
            );
            $this->assertNotNull($permissionMiddleware, 'Missing permission middleware on '.$route->uri());
            $this->assertContains(substr($permissionMiddleware, 11), $known, 'Unknown permission on '.$route->uri());
        }
    }
}
