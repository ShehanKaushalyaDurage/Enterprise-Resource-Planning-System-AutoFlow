<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        if (!empty($roles) && !$user->hasRole($roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Required role: ' . implode(' or ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
