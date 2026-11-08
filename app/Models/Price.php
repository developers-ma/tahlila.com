<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Price extends Model
{
    use HasFactory;
    
    protected $fillable = ['medical_test_id','test_name','test_description','test_unit', 'test_reference_value','test_unit_2','test_reference_value_2','test_required_age','test_required_weight','test_required_height','test_requiring_conclusion','price'];

    // Define the relationship with Category
    public function categories()
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    // Define the relationship with Group
    public function groups()
    {
        return $this->belongsToMany(Group::class)->withTimestamps();
    }
}
