<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceCard;
use App\Services\ServiceCardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCardController extends Controller
{
    public function __construct(private readonly ServiceCardService $service)
    {}

    public function index(Request $request): JsonResponse
    {
        $query = ServiceCard::with(['vehicle', 'owner', 'serviceType', 'technician', 'invoice'])
            ->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }
        if ($request->has('vehicle_no')) {
            $query->whereHas('vehicle', fn($q) => $q->where('vehicle_no', 'ilike', "%{$request->vehicle_no}%"));
        }

        $cards = $query->paginate($request->integer('per_page', 25));

        return response()->json(['success' => true, 'data' => $cards]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vehicle_id'          => ['required', 'uuid', 'exists:vehicles,id'],
            'owner_id'            => ['required', 'uuid', 'exists:owners,id'],
            'service_type_id'     => ['required', 'uuid', 'exists:service_types,id'],
            'oil_type_id'         => ['nullable', 'uuid', 'exists:oil_types,id'],
            'oil_quantity_liters' => ['nullable', 'numeric', 'min:0'],
            'remarks'             => ['nullable', 'string'],
            'inspection_notes'    => ['nullable', 'string'],
            'technician_id'       => ['nullable', 'uuid', 'exists:users,id'],
            'mileage_at_service'  => ['nullable', 'numeric', 'min:0'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string'],
            'items.*.item_type'   => ['required', 'in:labour,part,consumable'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price'  => ['required', 'integer', 'min:0'],
            'items.*.stock_item_id' => ['nullable', 'uuid', 'exists:stock_items,id'],
        ]);

        $result = $this->service->create($data, $request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => $result,
            'message' => "Service card {$result['card']->card_no} created.",
        ], 201);
    }

    public function show(ServiceCard $serviceCard): JsonResponse
    {
        $serviceCard->load(['vehicle.owner', 'owner', 'serviceType', 'oilType', 'technician', 'createdBy', 'items.stockItem', 'invoice.payments.collectedBy']);

        return response()->json(['success' => true, 'data' => $serviceCard]);
    }

    public function update(Request $request, ServiceCard $serviceCard): JsonResponse
    {
        if (!$serviceCard->isEditable()) {
            return response()->json(['success' => false, 'message' => 'Cannot edit a completed or cancelled card.'], 422);
        }

        $data = $request->validate([
            'remarks'           => ['nullable', 'string'],
            'inspection_notes'  => ['nullable', 'string'],
            'technician_id'     => ['nullable', 'uuid', 'exists:users,id'],
            'mileage_at_service'=> ['nullable', 'numeric'],
            'oil_type_id'       => ['nullable', 'uuid', 'exists:oil_types,id'],
            'oil_quantity_liters'=> ['nullable', 'numeric', 'min:0'],
            'items'             => ['nullable', 'array'],
            'items.*.description' => ['required', 'string'],
            'items.*.item_type'   => ['required', 'in:labour,part,consumable'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price'  => ['required', 'integer', 'min:0'],
            'items.*.stock_item_id' => ['nullable', 'uuid', 'exists:stock_items,id'],
        ]);

        $res = $this->service->update($serviceCard, $data);

        return response()->json(['success' => true, 'data' => $res['card'], 'message' => 'Card updated.']);
    }

    public function updateStatus(Request $request, ServiceCard $serviceCard): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:in_progress,completed,cancelled'],
        ]);

        $this->service->updateStatus($serviceCard, $data['status'], $request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => $serviceCard->fresh(),
            'message' => "Status updated to {$data['status']}.",
        ]);
    }
}
