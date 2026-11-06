<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InternalChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_exchange_and_read_private_messages(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $this->actingAs($sender)->postJson('/chat/messages', [
            'recipient_id' => $recipient->id,
            'body' => 'Bonjour, les résultats sont prêts.',
        ])->assertCreated()->assertJsonPath('message.body', 'Bonjour, les résultats sont prêts.');

        $this->actingAs($recipient)->getJson('/api/chat/unread')->assertOk()->assertJsonPath('count', 1);
        $this->getJson('/api/chat/conversation/'.$sender->id)
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('unreadCount', 0);

        $this->assertNotNull(ChatMessage::firstOrFail()->read_at);
    }

    public function test_staff_cannot_message_themselves(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/chat/messages', [
            'recipient_id' => $user->id,
            'body' => 'Test',
        ])->assertUnprocessable()->assertJsonValidationErrors('recipient_id');
    }

    public function test_staff_can_share_files_only_with_conversation_participants(): void
    {
        Storage::fake('public');
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $outsider = User::factory()->create();

        $response = $this->actingAs($sender)->post('/chat/messages', [
            'recipient_id' => $recipient->id,
            'body' => 'Compte rendu joint',
            'attachments' => [
                UploadedFile::fake()->create('compte-rendu.pdf', 250, 'application/pdf'),
                UploadedFile::fake()->image('capture-resultat.jpg'),
            ],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()->assertJsonPath('message.attachments.0.original_name', 'compte-rendu.pdf');
        $attachment = $response->json('message.attachments.0');

        $this->actingAs($recipient)->get($attachment['url'])->assertOk();
        $this->actingAs($recipient)
            ->get($response->json('message.attachments.1.url').'?inline=1')
            ->assertOk()
            ->assertHeader('content-disposition', 'inline; filename=capture-resultat.jpg');
        $this->actingAs($outsider)->get($attachment['url'])->assertForbidden();
    }
}
