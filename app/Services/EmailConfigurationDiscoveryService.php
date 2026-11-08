<?php

namespace App\Services;

class EmailConfigurationDiscoveryService
{
    public function discover(string $email): array
    {
        $domain = strtolower((string) str($email)->afterLast('@'));
        $provider = $this->providerFor($domain, $this->mxHosts($domain));

        return match ($provider) {
            'google' => $this->configuration('Google / Gmail', 'smtp.gmail.com', 587, 'tls', 'imap.gmail.com', 993, 'ssl'),
            'microsoft' => $this->configuration('Microsoft 365 / Outlook', 'smtp.office365.com', 587, 'tls', 'outlook.office365.com', 993, 'ssl'),
            'yahoo' => $this->configuration('Yahoo Mail', 'smtp.mail.yahoo.com', 465, 'ssl', 'imap.mail.yahoo.com', 993, 'ssl'),
            'icloud' => $this->configuration('Apple iCloud Mail', 'smtp.mail.me.com', 587, 'tls', 'imap.mail.me.com', 993, 'ssl'),
            'zoho' => $this->configuration('Zoho Mail', 'smtp.zoho.com', 587, 'tls', 'imap.zoho.com', 993, 'ssl'),
            'aol' => $this->configuration('AOL Mail', 'smtp.aol.com', 465, 'ssl', 'imap.aol.com', 993, 'ssl'),
            // cPanel/Roundcube and most professional hosting platforms expose
            // both protocols through mail.domain.tld. Guessing imap.* or
            // smtp.* often reaches the same server with a certificate issued
            // only for mail.*, causing a hostname mismatch.
            default => $this->configuration('Messagerie professionnelle', 'mail.'.$domain, 587, 'tls', 'mail.'.$domain, 993, 'ssl', true),
        };
    }

    private function providerFor(string $domain, array $mxHosts): string
    {
        return match (true) {
            in_array($domain, ['gmail.com', 'googlemail.com'], true), $this->contains($mxHosts, ['google.com', 'googlemail.com']) => 'google',
            in_array($domain, ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'], true), $this->contains($mxHosts, ['outlook.com', 'protection.outlook.com']) => 'microsoft',
            in_array($domain, ['yahoo.com', 'ymail.com'], true), $this->contains($mxHosts, ['yahoodns.net', 'yahoo.com']) => 'yahoo',
            in_array($domain, ['icloud.com', 'me.com', 'mac.com'], true) => 'icloud',
            str_contains($domain, 'zoho.'), $this->contains($mxHosts, ['zoho.com', 'zohomail.com']) => 'zoho',
            $domain === 'aol.com' => 'aol',
            default => 'professional',
        };
    }

    private function mxHosts(string $domain): array
    {
        if ($domain === '' || ! function_exists('dns_get_record')) return [];
        try {
            return collect(dns_get_record($domain, DNS_MX) ?: [])->pluck('target')->filter()->map(fn ($host) => strtolower(rtrim($host, '.')))->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function contains(array $hosts, array $needles): bool
    {
        return collect($hosts)->contains(fn ($host) => collect($needles)->contains(fn ($needle) => str_contains($host, $needle)));
    }

    private function configuration(string $provider, string $smtpHost, int $smtpPort, string $smtpEncryption, string $imapHost, int $imapPort, string $imapEncryption, bool $suggested = false): array
    {
        return compact('provider', 'smtpHost', 'smtpPort', 'smtpEncryption', 'imapHost', 'imapPort', 'imapEncryption', 'suggested');
    }
}
