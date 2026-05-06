<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();
        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }
        $suppliers = $query->orderBy('name')->paginate($request->integer('per_page', 25));
        return response()->json(['success' => true, 'data' => $suppliers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['required', 'string'],
            'contact_person' => ['nullable', 'string'],
            'phone'          => ['required', 'string'],
            'email'          => ['nullable', 'email'],
            'address'        => ['nullable', 'string'],
        ]);
        $supplier = Supplier::create($data);
        return response()->json(['success' => true, 'data' => $supplier, 'message' => 'Supplier created.'], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $supplier->load('stockItems')]);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['sometimes', 'string'],
            'contact_person' => ['nullable', 'string'],
            'phone'          => ['sometimes', 'string'],
            'email'          => ['nullable', 'email'],
            'address'        => ['nullable', 'string'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);
        $supplier->update($data);
        return response()->json(['success' => true, 'data' => $supplier, 'message' => 'Supplier updated.']);
    }
}
