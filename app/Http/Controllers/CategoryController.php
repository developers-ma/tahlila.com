<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Category;


class CategoryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|unique:categories,category_name',
        ]);

        Category::create($validated);

        return redirect('categories')
            ->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'category_name' => 'required|unique:categories,category_name,' . $category->id,
        ]);

        $category->update($validated);

        return redirect('categories')
            ->with('success', 'Category updated successfully');
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return redirect('categories')
            ->with('success', 'Category deleted successfully');
    }
}
