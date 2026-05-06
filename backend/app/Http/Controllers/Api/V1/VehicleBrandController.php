<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\VehicleBrand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleBrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VehicleBrand::query();
        
        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        $brands = $query->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $brands]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'unique:vehicle_brands,name'],
            'is_active' => ['boolean']
        ]);

        $brand = VehicleBrand::create($data);

        return response()->json(['success' => true, 'data' => $brand, 'message' => 'Vehicle brand created.'], 201);
    }

    public function update(Request $request, VehicleBrand $vehicleBrand): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'unique:vehicle_brands,name,' . $vehicleBrand->id],
            'is_active' => ['sometimes', 'boolean']
        ]);

        $vehicleBrand->update($data);

        return response()->json(['success' => true, 'data' => $vehicleBrand, 'message' => 'Vehicle brand updated.']);
    }

    public function destroy(VehicleBrand $vehicleBrand): JsonResponse
    {
        // Prevent deletion if associated with vehicles
        if (\App\Models\Vehicle::where('brand_id', $vehicleBrand->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete brand as it is associated with vehicles. Deactivate it instead.'], 422);
        }

        $vehicleBrand->delete();

        return response()->json(['success' => true, 'message' => 'Vehicle brand deleted.']);
    }
}
