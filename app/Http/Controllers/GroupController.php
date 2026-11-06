<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Group;


class GroupController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'group_name' => 'required|unique:groups,group_name',
            // add more validation rules if necessary
        ]);

        Group::create($validated);

        return redirect('groups')
            ->with('success', 'Group created successfully');
    }

    public function update(Request $request, Group $group)
    {
        $validated = $request->validate([
            'group_name' => 'required|unique:groups,group_name,' . $group->id,
            // add more validation rules if necessary
        ]);

        $group->update($validated);

        return redirect('groups')
            ->with('success', 'Group updated successfully');
    }

    public function destroy(Group $group)
    {
        $group->delete();

        return redirect('groups')
            ->with('success', 'Group deleted successfully');
    }
}
