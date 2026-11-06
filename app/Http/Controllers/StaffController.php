<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class StaffController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateUser($request);
        $validated['password'] = Hash::make($validated['password']);
        $validated['email_verified_at'] = now();
        $validated['permissions'] = $this->permissionsForRole(
            (int) $validated['role_id'],
            $validated['permissions'] ?? [],
        );
        unset($validated['password_confirmation']);

        User::create($validated);

        return redirect('/staff')->with('success', 'Le collaborateur a été ajouté avec ses accès.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $this->validateUser($request, $user);
        $this->ensureAdministratorRemains($user, (int) $validated['role_id']);
        $validated['permissions'] = $this->permissionsForRole(
            (int) $validated['role_id'],
            $validated['permissions'] ?? [],
        );

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }
        unset($validated['password_confirmation']);

        $user->update($validated);

        return redirect('/staff')->with('success', 'Les accès du collaborateur ont été mis à jour.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages(['user' => 'Vous ne pouvez pas supprimer votre propre compte depuis cette page.']);
        }
        $this->ensureAdministratorRemains($user, null);
        $user->delete();

        return redirect('/staff')->with('success', 'Le compte collaborateur a été supprimé.');
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user)],
            'role_id' => ['required', 'integer', Rule::exists(Role::class, 'id')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(array_keys(config('lims_permissions.permissions')))],
            'password' => [$user ? 'nullable' : 'required', 'confirmed', Password::defaults()],
        ]);
    }

    private function validPermissions(array $permissions): array
    {
        return array_values(array_intersect($permissions, array_keys(config('lims_permissions.permissions'))));
    }

    private function permissionsForRole(int $roleId, array $permissions): ?array
    {
        $role = Role::findOrFail($roleId);

        return $role->slug === 'administrator'
            ? null
            : $this->validPermissions($permissions);
    }

    private function ensureAdministratorRemains(User $user, ?int $newRoleId): void
    {
        if (! $user->isAdministrator()) {
            return;
        }
        $administratorRoleId = Role::where('slug', 'administrator')->value('id');
        if ($newRoleId === $administratorRoleId) {
            return;
        }
        if (User::where('role_id', $administratorRoleId)->count() > 1) {
            return;
        }

        throw ValidationException::withMessages(['role_id' => 'Le laboratoire doit conserver au moins un administrateur.']);
    }
}
