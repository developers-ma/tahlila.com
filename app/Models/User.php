<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'permissions',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function isAdministrator(): bool
    {
        return $this->role?->slug === 'administrator';
    }

    public function hasPermission(string $permission): bool
    {
        // Role-less records only occur in legacy/test data. Real users are assigned
        // a role by the migration, administrator UI, or registration flow.
        if (! $this->role_id) {
            return true;
        }
        if ($this->isAdministrator()) {
            return true;
        }

        // Non-administrator permissions are an explicit selection. Null is kept
        // as a compatibility fallback for records created before granular access.
        $permissions = $this->permissions ?? $this->role?->permissions ?? [];

        return in_array($permission, $permissions, true);
    }

    public function permissionKeys(): array
    {
        if (! $this->role_id || $this->isAdministrator()) {
            return array_keys(config('lims_permissions.permissions'));
        }

        return array_values($this->permissions ?? $this->role?->permissions ?? []);
    }
}
