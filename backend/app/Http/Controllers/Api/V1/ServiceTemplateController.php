<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceTemplate;
use App\Models\ServiceTemplateOilBrand;
use App\Models\ServiceTemplateOilGrade;
use App\Services\ServiceTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceTemplateController extends Controller
{
    public function __construct(private readonly ServiceTemplateService $serviceTemplateService)
    {}

    public function index(): JsonResponse
    {
        $templates = ServiceTemplate::with(['brands.grades', 'requiredItems.stockItem'])->get();
        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function brands(ServiceTemplate $template): JsonResponse
    {
        $brands = $template->brands()->with('grades')->get();
        return response()->json(['success' => true, 'data' => $brands]);
    }

    public function grades(ServiceTemplateOilBrand $brand): JsonResponse
    {
        $grades = $brand->grades()->with('stockItem')->get();
        return response()->json(['success' => true, 'data' => $grades]);
    }

    public function packagePrice(Request $request): JsonResponse
    {
        $request->validate([
            'oil_grade_id' => ['required', 'exists:service_template_oil_grades,id'],
        ]);

        $grade = ServiceTemplateOilGrade::with(['brand.template', 'stockItem'])->findOrFail($request->oil_grade_id);
        $lineItems = $this->serviceTemplateService->buildLineItems($grade);

        return response()->json([
            'success' => true,
            'data' => [
                'line_items' => $lineItems,
                'total_price' => collect($lineItems)->sum('line_total'),
            ],
        ]);
    }

    public function customisePackagePrice(Request $request): JsonResponse
    {
        $request->validate([
            'oil_grade_id' => ['required', 'exists:service_template_oil_grades,id'],
            'custom_qtys' => ['required', 'array'],
            'custom_qtys.oil' => ['required', 'numeric', 'min:0.01'],
            'custom_qtys.oil_filter' => ['required', 'numeric', 'min:0.01'],
            'custom_qtys.drain_plug_seal' => ['required', 'numeric', 'min:0.01'],
        ]);

        $grade = ServiceTemplateOilGrade::with(['brand.template', 'stockItem'])->findOrFail($request->oil_grade_id);
        $lineItems = $this->serviceTemplateService->buildLineItems($grade, $request->custom_qtys);

        return response()->json([
            'success' => true,
            'data' => [
                'line_items' => $lineItems,
                'total_price' => collect($lineItems)->sum('line_total'),
            ],
        ]);
    }
}
