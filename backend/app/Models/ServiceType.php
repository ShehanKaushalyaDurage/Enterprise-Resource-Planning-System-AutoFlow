<?php

namespace App\Models;

class ServiceType extends BaseModel
{
    public $timestamps = true;
    protected $fillable = ['name', 'label', 'description'];
}

// app/Models/OilType.php is in a separate file
