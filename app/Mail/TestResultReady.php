<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestResultReady extends Mailable
{
    use Queueable, SerializesModels;

    // Optionally, you can pass data here (e.g., patient information)
    public $patientEmail;

    /**
     * Create a new message instance.
     */
    public function __construct($patientEmail)
    {
        $this->patientEmail = $patientEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __("The analysis results of your test are now ready"), // The subject of the email
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.templates.test_result_ready', // View file for the email content
            // Optionally, you can pass variables to the view here, for example:
            // data: ['patientEmail' => $this->patientEmail]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}