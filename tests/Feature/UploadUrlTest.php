<?php

namespace Tests\Feature;

use App\Models\{ChatAttachment,LaboratorySetting,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UploadUrlTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploaded_file_urls_do_not_depend_on_app_url(): void
    {
        config(['app.url'=>'https://wrong.example.test','filesystems.disks.public.url'=>'/storage']);
        $user=User::factory()->create(['profile_photo_path'=>'profile-photos/avatar.png']);
        $laboratory=LaboratorySetting::first();
        $laboratory->update(['logo'=>'logos/laboratory.png']);
        $attachment=new ChatAttachment(['path'=>'chat-attachments/report.pdf','original_name'=>'report.pdf','mime_type'=>'application/pdf','size'=>10]);
        $attachment->id=42;

        $this->assertSame('/storage/profile-photos/avatar.png',$user->profilePhotoUrl());
        $this->assertSame('/storage/logos/laboratory.png',$laboratory->fresh()->logo_url);
        $this->assertSame('/chat/attachments/42',$attachment->url);
    }
}
