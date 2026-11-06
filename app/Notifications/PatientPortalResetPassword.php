<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PatientPortalResetPassword extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = url('/patient/reset-password/'.$this->token.'?email='.urlencode($notifiable->email));

        return (new MailMessage)
            ->subject('Accès sécurisé à vos résultats de laboratoire')
            ->greeting('Bonjour '.$notifiable->patient->firstname.',')
            ->line('Vous avez demandé à créer ou réinitialiser le mot de passe de votre espace patient.')
            ->action('Définir mon mot de passe', $url)
            ->line('Ce lien expire dans 60 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.');
    }
}
