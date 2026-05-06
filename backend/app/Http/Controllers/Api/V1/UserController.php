<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService)
    {}

    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->filled('role'), fn($q) => $q->where('role', $request->role))
            ->when($request->filled('search'), fn($q) => $q->where('name', 'ilike', "%{$request->search}%"))
            ->when($request->filled('status'), function ($q) use ($request) {
                $status = $request->status === 'active';
                $q->where('is_active', $status);
            })
            ->latest()
            ->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'email'             => ['required', 'email', 'unique:users,email'],
            'phone'             => ['nullable', 'string'],
            'role'              => ['required', 'in:admin,manager,technician,cashier,receptionist'],
            'password'          => ['required', Password::min(8)],
            'avatar_path'       => ['nullable', 'string'],
            'date_of_birth'     => ['nullable', 'date'],
            'joined_date'       => ['nullable', 'date'],
            'emergency_contact' => ['nullable', 'string'],
            'notes'             => ['nullable', 'string'],
        ]);

        $user = $this->userService->createUser($data);

        return response()->json(['success' => true, 'data' => $user, 'message' => 'User created.'], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'              => ['sometimes', 'string'],
            'email'             => ['sometimes', 'email', "unique:users,email,{$user->id}"],
            'phone'             => ['nullable', 'string'],
            'role'              => ['sometimes', 'in:admin,manager,technician,cashier,receptionist'],
            'is_active'         => ['sometimes', 'boolean'],
            'avatar_path'       => ['nullable', 'string'],
            'date_of_birth'     => ['nullable', 'date'],
            'joined_date'       => ['nullable', 'date'],
            'emergency_contact' => ['nullable', 'string'],
            'notes'             => ['nullable', 'string'],
        ]);

        $user->update($data);

        return response()->json(['success' => true, 'data' => $user, 'message' => 'User updated.']);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()?->id) {
            return response()->json(['success' => false, 'message' => 'Cannot toggle your own status.'], 422);
        }
        $this->userService->toggleActive($user);
        return response()->json(['success' => true, 'data' => $user, 'message' => 'User status updated.']);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', Password::min(8)],
            'reason'   => ['nullable', 'string'],
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        DB::table('user_password_resets')->insert([
            'id'       => Str::uuid()->toString(),
            'user_id'  => $user->id,
            'reset_by' => $request->user()?->id ?? $user->id,
            'reset_at' => now(),
            'reason'   => $data['reason'] ?? 'Admin password reset',
        ]);

        return response()->json(['success' => true, 'message' => 'Password reset successful.']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()?->id) {
            return response()->json(['success' => false, 'message' => 'Cannot delete yourself.'], 422);
        }
        $user->update(['is_active' => false]);
        $user->delete();
        return response()->json(['success' => true, 'message' => 'User deleted successfully.']);
    }
}
