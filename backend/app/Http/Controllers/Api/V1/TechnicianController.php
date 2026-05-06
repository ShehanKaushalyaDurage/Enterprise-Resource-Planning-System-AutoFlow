<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Technician;
use App\Services\TechnicianService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class TechnicianController extends Controller
{
    public function __construct(private readonly TechnicianService $technicianService)
    {}

    public function index(Request $request): JsonResponse
    {
        $techs = Technician::query()
            ->with('user')
            ->when($request->filled('specialization'), function ($q) use ($request) {
                $q->whereJsonContains('specialization', $request->specialization);
            })
            ->when($request->filled('is_available'), function ($q) use ($request) {
                $q->where('is_available', filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN));
            })
            ->latest()
            ->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $techs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'unique:users,email'],
            'phone'            => ['nullable', 'string'],
            'password'         => ['required', Password::min(8)],
            'specialization'   => ['nullable', 'array'],
            'certification'    => ['nullable', 'string'],
            'experience_years' => ['nullable', 'integer'],
            'is_available'     => ['nullable', 'boolean'],
            'workshop_bay'     => ['nullable', 'string'],
            'joined_date'      => ['nullable', 'date'],
        ]);

        $tech = $this->technicianService->createTechnician($data);

        return response()->json(['success' => true, 'data' => $tech, 'message' => 'Technician profile created successfully.'], 201);
    }

    public function show(Technician $technician): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $technician->load('user')
        ]);
    }

    public function update(Request $request, Technician $technician): JsonResponse
    {
        $data = $request->validate([
            'specialization'   => ['nullable', 'array'],
            'certification'    => ['nullable', 'string'],
            'experience_years' => ['nullable', 'integer'],
            'is_available'     => ['nullable', 'boolean'],
            'workshop_bay'     => ['nullable', 'string'],
        ]);

        $technician->update($data);

        return response()->json([
            'success' => true,
            'data' => $technician->load('user'),
            'message' => 'Technician updated successfully.'
        ]);
    }

    public function toggleAvailable(Technician $technician): JsonResponse
    {
        $technician->update(['is_available' => !$technician->is_available]);
        return response()->json([
            'success' => true,
            'data' => $technician->load('user'),
            'message' => 'Technician availability updated.'
        ]);
    }

    public function progress(Technician $technician): JsonResponse
    {
        $totalCards = \Illuminate\Support\Facades\DB::table('service_cards')
            ->where('technician_id', $technician->user_id)
            ->where('status', 'completed')
            ->count();

        $totalRevenue = (int) \Illuminate\Support\Facades\DB::table('service_card_items')
            ->join('service_cards', 'service_card_items.service_card_id', '=', 'service_cards.id')
            ->where('service_cards.technician_id', $technician->user_id)
            ->where('service_cards.status', 'completed')
            ->sum(\Illuminate\Support\Facades\DB::raw('service_card_items.quantity * service_card_items.unit_price'));

        $avgDuration = (float) \Illuminate\Support\Facades\DB::table('service_cards')
            ->where('technician_id', $technician->user_id)
            ->where('status', 'completed')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_duration')
            ->value('avg_duration');

        // Score: target 10 completed cards = 100%
        $productivityScore = min(100, $totalCards * 10);

        return response()->json([
            'success' => true,
            'data' => [
                'productivity_score' => $productivityScore,
                'total_cards' => $totalCards,
                'total_revenue' => $totalRevenue,
                'avg_duration' => round($avgDuration, 2),
            ]
        ]);
    }

    public function leaderboard(): JsonResponse
    {
        $leaderboard = \Illuminate\Support\Facades\DB::table('technicians')
            ->join('users', 'technicians.user_id', '=', 'users.id')
            ->leftJoin('service_cards', function ($join) {
                $join->on('technicians.user_id', '=', 'service_cards.technician_id')
                    ->where('service_cards.status', '=', 'completed');
            })
            ->leftJoin('service_card_items', 'service_cards.id', '=', 'service_card_items.service_card_id')
            ->select(
                'technicians.id',
                'users.full_name as name',
                \Illuminate\Support\Facades\DB::raw('COUNT(DISTINCT service_cards.id) as total_cards'),
                \Illuminate\Support\Facades\DB::raw('COALESCE(SUM(service_card_items.quantity * service_card_items.unit_price), 0) as total_revenue')
            )
            ->groupBy('technicians.id', 'users.full_name')
            ->orderByDesc('total_cards')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $leaderboard
        ]);
    }
}
