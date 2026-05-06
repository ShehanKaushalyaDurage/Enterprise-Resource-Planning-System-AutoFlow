<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PettyCashSession;
use App\Services\PettyCashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PettyCashController extends Controller
{
    public function __construct(private readonly PettyCashService $service)
    {}

    // Sessions
    public function sessionIndex(Request $request): JsonResponse
    {
        $sessions = PettyCashSession::with('openedBy')
            ->orderBy('session_date', 'desc')
            ->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    public function sessionToday(): JsonResponse
    {
        $session = PettyCashSession::today();
        return response()->json(['success' => true, 'data' => $session]);
    }

    public function openSession(Request $request): JsonResponse
    {
        $data = $request->validate([
            'daily_limit' => ['nullable', 'integer', 'min:1'],
        ]);

        $session = $this->service->openSession($request->user()->id, $data['daily_limit'] ?? null);

        return response()->json(['success' => true, 'data' => $session, 'message' => 'Session opened.'], 201);
    }

    // Entries
    public function entryIndex(Request $request): JsonResponse
    {
        $query = \App\Models\PettyCashEntry::with('issuedBy', 'session');

        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }
        if ($request->has('date')) {
            $query->whereHas('session', fn($q) => $q->whereDate('session_date', $request->date));
        }

        $entries = $query->latest('issued_at')->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $entries]);
    }

    public function issueEntry(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reason'     => ['required', 'string'],
            'amount'     => ['required', 'integer', 'min:1'],
            'issued_to'  => ['nullable', 'string'],
            'receipt_no' => ['nullable', 'string'],
        ]);

        $session = PettyCashSession::today();
        if (!$session) {
            return response()->json(['success' => false, 'message' => 'No open session for today. Please open a session first.'], 422);
        }

        $entry = $this->service->issueEntry($session, $data, $request->user()->id);

        return response()->json(['success' => true, 'data' => ['entry' => $entry, 'session' => $session->fresh()], 'message' => 'Entry recorded.'], 201);
    }
}
