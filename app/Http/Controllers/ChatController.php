<?php

namespace App\Http\Controllers;

use App\Models\ChatAttachment;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', Rule::exists(User::class, 'id')->where(fn ($query) => $query->where('id', '!=', $request->user()->id))],
            'body' => ['nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,csv,txt'],
        ]);

        $body = trim($validated['body'] ?? '');
        if ($body === '' && ! $request->hasFile('attachments')) {
            throw ValidationException::withMessages(['body' => 'Ajoutez un message ou une pièce jointe.']);
        }

        $message = DB::transaction(function () use ($request, $validated, $body): ChatMessage {
            $message = ChatMessage::create([
                'sender_id' => $request->user()->id,
                'recipient_id' => $validated['recipient_id'],
                'body' => $body,
            ]);
            foreach ($request->file('attachments', []) as $file) {
                $path = $file->store('chat-attachments', 'public');
                $message->attachments()->create([
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                    'size' => $file->getSize(),
                ]);
            }

            return $message->load('attachments');
        });

        return response()->json(['message' => $this->serialize($message)], 201);
    }

    public function conversation(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 404);
        ChatMessage::where('sender_id', $user->id)
            ->where('recipient_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = ChatMessage::where(function ($query) use ($request, $user): void {
            $query->where('sender_id', $request->user()->id)->where('recipient_id', $user->id);
        })->orWhere(function ($query) use ($request, $user): void {
            $query->where('sender_id', $user->id)->where('recipient_id', $request->user()->id);
        })->with('attachments')->latest('id')->limit(150)->get()->reverse()->values()->map(fn (ChatMessage $message) => $this->serialize($message));

        return response()->json([
            'messages' => $messages,
            'unreadCount' => ChatMessage::where('recipient_id', $request->user()->id)->whereNull('read_at')->count(),
        ]);
    }

    public function unread(Request $request): JsonResponse
    {
        return response()->json([
            'count' => ChatMessage::where('recipient_id', $request->user()->id)->whereNull('read_at')->count(),
        ]);
    }

    public function attachment(Request $request, ChatAttachment $attachment): mixed
    {
        $message = $attachment->message;
        abort_unless(in_array($request->user()->id, [$message->sender_id, $message->recipient_id], true), 403);
        abort_unless(Storage::disk('public')->exists($attachment->path), 404);

        $headers = [
            'Content-Type' => $attachment->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ];

        if ($request->boolean('inline') && $attachment->is_image) {
            return Storage::disk('public')->response(
                $attachment->path,
                $attachment->original_name,
                $headers,
                'inline'
            );
        }

        return Storage::disk('public')->download($attachment->path, $attachment->original_name, $headers);
    }

    private function serialize(ChatMessage $message): array
    {
        $message->loadMissing('attachments');

        return [
            'id' => $message->id,
            'sender_id' => $message->sender_id,
            'recipient_id' => $message->recipient_id,
            'body' => $message->body,
            'read_at' => $message->read_at?->toAtomString(),
            'created_at' => $message->created_at?->toAtomString(),
            'attachments' => $message->attachments->map(fn (ChatAttachment $attachment) => $attachment->toArray())->values(),
        ];
    }
}
