<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OwnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Owner::query()->withCount('vehicles');

        if ($request->has('search')) {
            $query->search($request->search);
        }

        $owners = $query->latest()->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $owners]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name'  => ['required', 'string', 'max:255'],
            'contact_no' => ['required', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'max:255'],
            'address'    => ['required', 'string'],
            'nic_no'     => ['nullable', 'string', 'max:20', 'unique:owners,nic_no'],
        ]);

        $owner = Owner::create($data);

        return response()->json(['success' => true, 'data' => $owner, 'message' => 'Owner created.'], 201);
    }

    public function show(Owner $owner): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $owner->load(['vehicles'])]);
    }

    public function update(Request $request, Owner $owner): JsonResponse
    {
        $data = $request->validate([
            'full_name'  => ['sometimes', 'required', 'string', 'max:255'],
            'contact_no' => ['sometimes', 'required', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'max:255'],
            'address'    => ['sometimes', 'required', 'string'],
            'nic_no'     => ['nullable', 'string', 'max:20', "unique:owners,nic_no,{$owner->id}"],
        ]);

        $owner->update($data);

        return response()->json(['success' => true, 'data' => $owner, 'message' => 'Owner updated.']);
    }

    public function destroy(Owner $owner): JsonResponse
    {
        $owner->delete();
        return response()->json(['success' => true, 'message' => 'Owner deleted.']);
    }
}
