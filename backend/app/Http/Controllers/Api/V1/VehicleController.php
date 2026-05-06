<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::with(['owner', 'brand'])->withCount('serviceCards');

        if ($request->has('search')) {
            $query->search($request->search);
        }

        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        $vehicles = $query->latest()->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $vehicles]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'owner_id'               => ['required', 'uuid', 'exists:owners,id'],
            'vehicle_no'             => ['required', 'string', 'max:20', 'unique:vehicles,vehicle_no'],
            'model'                  => ['required', 'string', 'max:100'],
            'brand_id'               => ['required', 'uuid', 'exists:vehicle_brands,id'],
            'category'               => ['required', 'in:car,van,bike,truck,bus'],
            'fuel_type'              => ['required', 'in:petrol,diesel,electric,hybrid'],
            'color'                  => ['required', 'string', 'max:50'],
            'year_of_manufacture'    => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'mileage_at_registration'=> ['nullable', 'numeric', 'min:0'],
        ]);

        $vehicle = Vehicle::create($data);

        return response()->json(['success' => true, 'data' => $vehicle->load(['owner', 'brand']), 'message' => 'Vehicle registered.'], 201);
    }

    public function show(Vehicle $vehicle): JsonResponse
    {
        $vehicle->load(['owner', 'brand', 'serviceCards.serviceType', 'serviceCards.invoice']);
        $vehicle->loadCount('serviceCards');

        return response()->json(['success' => true, 'data' => $vehicle]);
    }

    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        $data = $request->validate([
            'owner_id'    => ['sometimes', 'uuid', 'exists:owners,id'],
            'vehicle_no'  => ['sometimes', 'string', 'max:20', "unique:vehicles,vehicle_no,{$vehicle->id}"],
            'model'       => ['sometimes', 'string', 'max:100'],
            'brand_id'    => ['sometimes', 'uuid', 'exists:vehicle_brands,id'],
            'category'    => ['sometimes', 'in:car,van,bike,truck,bus'],
            'fuel_type'   => ['sometimes', 'in:petrol,diesel,electric,hybrid'],
            'color'       => ['sometimes', 'string', 'max:50'],
            'year_of_manufacture'    => ['nullable', 'integer'],
            'mileage_at_registration'=> ['nullable', 'numeric'],
        ]);

        $vehicle->update($data);

        return response()->json(['success' => true, 'data' => $vehicle, 'message' => 'Vehicle updated.']);
    }

    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $vehicle->delete();
        return response()->json(['success' => true, 'message' => 'Vehicle deleted.']);
    }

    public function history(Vehicle $vehicle): JsonResponse
    {
        $cards = $vehicle->serviceCards()
            ->with(['serviceType', 'invoice', 'technician', 'createdBy', 'items'])
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'vehicle' => $vehicle->load(['owner', 'brand']),
                'history' => $cards,
            ],
        ]);
    }
}
