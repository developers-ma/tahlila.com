<?php

namespace Tests\Feature;

use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    public function test_not_found_page_displays_its_status_code(): void
    {
        $this->get('/this-page-does-not-exist')
            ->assertNotFound()
            ->assertSee('404')
            ->assertSee('Page not found');
    }

    public function test_method_not_allowed_page_displays_its_status_code(): void
    {
        $this->post('/csrf-token')
            ->assertStatus(405)
            ->assertSee('405')
            ->assertSee('Action not allowed');
    }
}
