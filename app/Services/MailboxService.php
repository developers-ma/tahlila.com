<?php

namespace App\Services;

use App\Models\EmailSetting;
use DOMDocument;
use DOMElement;
use RuntimeException;

class MailboxService
{
    public function __construct(private readonly EmailSetting $settings) {}

    public static function fromSettings(EmailSetting $settings): self
    {
        return new self($settings);
    }

    public function folders(): array
    {
        $connection = $this->connect('INBOX');
        try {
            $folders = imap_list($connection, $this->server(), '*') ?: [];

            return collect($folders)->map(function (string $folder): array {
                $name = substr($folder, strlen($this->server()));
                $decoded = function_exists('imap_utf7_decode') ? imap_utf7_decode($name) : $name;

                return ['id' => $name, 'name' => $decoded, 'type' => $this->folderType($decoded)];
            })->sortBy(fn (array $folder) => [$this->folderOrder($folder['type']), $this->folderPreference($folder['name'], $folder['type'])])
                ->unique(fn (array $folder) => $folder['type'] === 'folder' ? 'folder:'.$folder['id'] : $folder['type'])
                ->sortBy(fn (array $folder) => match ($folder['type']) {
                'inbox' => 0, 'sent' => 1, 'drafts' => 2, 'archive' => 3, 'trash' => 4, 'spam' => 5, default => 6,
            })->values()->all();
        } finally {
            imap_close($connection);
        }
    }

    public function messages(string $folder = 'INBOX', string $search = '', int $page = 1, int $perPage = 20): array
    {
        $connection = $this->connect($folder);
        try {
            $criteria = $search === '' ? 'ALL' : 'TEXT "'.addcslashes($search, '"\\').'"';
            $uids = imap_search($connection, $criteria, SE_UID) ?: [];
            rsort($uids, SORT_NUMERIC);
            $total = count($uids);
            $page = max(1, $page);
            $pageUids = array_slice($uids, ($page - 1) * $perPage, $perPage);
            if ($pageUids === []) {
                return ['data' => [], 'total' => $total, 'page' => $page, 'lastPage' => max(1, (int) ceil($total / $perPage))];
            }

            $overview = imap_fetch_overview($connection, implode(',', $pageUids), FT_UID) ?: [];
            $byUid = collect($overview)->keyBy(fn (object $item) => (int) $item->uid);
            $data = collect($pageUids)->map(function (int $uid) use ($byUid): ?array {
                $item = $byUid->get($uid);
                if (! $item) {
                    return null;
                }

                return [
                    'uid' => $uid,
                    'subject' => $this->decode($item->subject ?? '(Sans objet)'),
                    'from' => $this->decode($item->from ?? ''),
                    'to' => $this->decode($item->to ?? ''),
                    'date' => isset($item->udate) ? date(DATE_ATOM, (int) $item->udate) : ($item->date ?? null),
                    'seen' => (bool) ($item->seen ?? false),
                    'flagged' => (bool) ($item->flagged ?? false),
                    'answered' => (bool) ($item->answered ?? false),
                    'size' => (int) ($item->size ?? 0),
                ];
            })->filter()->values()->all();

            return ['data' => $data, 'total' => $total, 'page' => $page, 'lastPage' => max(1, (int) ceil($total / $perPage))];
        } finally {
            imap_close($connection);
        }
    }

    public function message(int $uid, string $folder = 'INBOX'): array
    {
        $connection = $this->connect($folder);
        try {
            $messageNumber = imap_msgno($connection, $uid);
            if ($messageNumber < 1) {
                throw new RuntimeException('Message introuvable.');
            }
            imap_setflag_full($connection, (string) $uid, '\\Seen', ST_UID);
            $header = imap_headerinfo($connection, $messageNumber);
            $structure = imap_fetchstructure($connection, $uid, FT_UID);
            $parts = $this->extractParts($connection, $uid, $structure);

            return [
                'uid' => $uid,
                'subject' => $this->decode($header->subject ?? '(Sans objet)'),
                'from' => $this->addresses($header->from ?? []),
                'to' => $this->addresses($header->to ?? []),
                'cc' => $this->addresses($header->cc ?? []),
                'replyTo' => $this->addresses($header->reply_to ?? $header->from ?? []),
                'date' => isset($header->udate) ? date(DATE_ATOM, (int) $header->udate) : ($header->date ?? null),
                'messageId' => trim($header->message_id ?? ''),
                'flagged' => ($header->Flagged ?? '') === 'F',
                'html' => $parts['html'] ? $this->sanitizeHtml($parts['html']) : null,
                'text' => $parts['text'] ?: trim(strip_tags($parts['html'] ?? '')),
                'attachments' => $parts['attachments'],
            ];
        } finally {
            imap_close($connection);
        }
    }

    public function attachment(int $uid, string $part, string $folder): array
    {
        $connection = $this->connect($folder);
        try {
            $structure = imap_fetchstructure($connection, $uid, FT_UID);
            $match = $this->findPart($structure, $part);
            if (! $match || empty($match['filename'])) {
                throw new RuntimeException('Pièce jointe introuvable.');
            }
            $content = imap_fetchbody($connection, $uid, $part, FT_UID | FT_PEEK);

            return [
                'name' => $match['filename'],
                'mime' => $match['mime'],
                'content' => $this->decodeBody($content ?: '', (int) ($match['encoding'] ?? 0)),
            ];
        } finally {
            imap_close($connection);
        }
    }

    public function flag(int $uid, string $folder, string $action): void
    {
        $connection = $this->connect($folder);
        try {
            match ($action) {
                'star' => imap_setflag_full($connection, (string) $uid, '\\Flagged', ST_UID),
                'unstar' => imap_clearflag_full($connection, (string) $uid, '\\Flagged', ST_UID),
                'read' => imap_setflag_full($connection, (string) $uid, '\\Seen', ST_UID),
                'unread' => imap_clearflag_full($connection, (string) $uid, '\\Seen', ST_UID),
                'archive' => $this->moveToFolderType($connection, $uid, 'archive', 'INBOX.Archive'),
                'delete' => $this->folderType($folder) === 'trash'
                    ? imap_delete($connection, (string) $uid, FT_UID)
                    : $this->moveToFolderType($connection, $uid, 'trash', 'INBOX.Trash'),
                default => throw new RuntimeException('Action de messagerie inconnue.'),
            };
            if (in_array($action, ['archive', 'delete'], true)) {
                imap_expunge($connection);
            }
        } finally {
            imap_close($connection);
        }
    }

    public function appendToSent(string $message): bool
    {
        $connection = $this->connect('INBOX');
        try {
            $folder = $this->findFolderByType($connection, 'sent') ?? 'INBOX.Sent';
            if (! $this->folderExists($connection, $folder)) {
                $mailbox = $this->server().$folder;
                if (! imap_createmailbox($connection, function_exists('imap_utf7_encode') ? imap_utf7_encode($mailbox) : $mailbox)) {
                    return false;
                }
            }

            return imap_append($connection, $this->server().$folder, $message, '\\Seen');
        } finally {
            imap_close($connection);
        }
    }

    private function connect(string $folder): mixed
    {
        if (! $this->settings->mailboxConfigured()) {
            throw new RuntimeException('La messagerie doit être configurée.');
        }
        $folder = str_replace(["\r", "\n", '{', '}'], '', $folder ?: 'INBOX');
        imap_errors();
        $connection = @imap_open($this->server().$folder, $this->settings->imap_username, $this->settings->imap_password, 0, 1);
        if (! $connection) {
            $errors = imap_errors() ?: [];
            throw new RuntimeException('Connexion IMAP impossible. '.($errors[0] ?? 'Vérifiez le serveur et les identifiants.'));
        }

        return $connection;
    }

    private function server(): string
    {
        $security = match ($this->settings->imap_encryption) {
            'ssl' => '/imap/ssl', 'tls' => '/imap/tls', default => '/imap/notls',
        };
        if (! $this->settings->imap_validate_cert) {
            $security .= '/novalidate-cert';
        }

        return '{'.$this->settings->imap_host.':'.$this->settings->imap_port.$security.'}';
    }

    private function extractParts(mixed $connection, int $uid, object|false $structure, string $prefix = ''): array
    {
        $result = ['text' => '', 'html' => '', 'attachments' => []];
        if (! $structure) {
            return $result;
        }
        $parts = $structure->parts ?? [$structure];
        foreach ($parts as $index => $part) {
            $section = $prefix === '' ? (string) ($index + 1) : $prefix.'.'.($index + 1);
            if (! empty($part->parts)) {
                $nested = $this->extractParts($connection, $uid, $part, $section);
                $result['text'] .= $nested['text'];
                $result['html'] .= $nested['html'];
                $result['attachments'] = [...$result['attachments'], ...$nested['attachments']];

                continue;
            }
            $metadata = $this->partMetadata($part, $section);
            if ($metadata['filename']) {
                $result['attachments'][] = $metadata;

                continue;
            }
            if ((int) ($part->type ?? -1) !== 0) {
                continue;
            }
            $body = imap_fetchbody($connection, $uid, $section, FT_UID | FT_PEEK);
            $body = $this->decodeBody($body ?: '', (int) ($part->encoding ?? 0));
            $body = $this->convertCharset($body, $part);
            if (strtoupper($part->subtype ?? 'PLAIN') === 'HTML') {
                $result['html'] .= $body;
            } else {
                $result['text'] .= $body;
            }
        }

        return $result;
    }

    private function findPart(object|false $structure, string $wanted, string $prefix = ''): ?array
    {
        if (! $structure) {
            return null;
        }
        foreach (($structure->parts ?? [$structure]) as $index => $part) {
            $section = $prefix === '' ? (string) ($index + 1) : $prefix.'.'.($index + 1);
            if ($section === $wanted) {
                return $this->partMetadata($part, $section) + ['encoding' => (int) ($part->encoding ?? 0)];
            }
            if (! empty($part->parts) && ($found = $this->findPart($part, $wanted, $section))) {
                return $found;
            }
        }

        return null;
    }

    private function partMetadata(object $part, string $section): array
    {
        $parameters = [...array_values((array) ($part->parameters ?? [])), ...array_values((array) ($part->dparameters ?? []))];
        $values = [];
        foreach ($parameters as $parameter) {
            $values[strtolower($parameter->attribute ?? '')] = $this->decode($parameter->value ?? '');
        }
        $filename = $values['filename'] ?? $values['name'] ?? null;
        $types = ['text', 'multipart', 'message', 'application', 'audio', 'image', 'video', 'other'];

        return [
            'part' => $section,
            'filename' => $filename,
            'mime' => ($types[(int) ($part->type ?? 7)] ?? 'application').'/'.strtolower($part->subtype ?? 'octet-stream'),
            'size' => (int) ($part->bytes ?? 0),
        ];
    }

    private function decodeBody(string $body, int $encoding): string
    {
        return match ($encoding) {
            3 => base64_decode($body, true) ?: '',
            4 => quoted_printable_decode($body),
            default => $body,
        };
    }

    private function convertCharset(string $body, object $part): string
    {
        foreach ($part->parameters ?? [] as $parameter) {
            if (strtolower($parameter->attribute ?? '') === 'charset' && strcasecmp($parameter->value, 'UTF-8') !== 0) {
                return mb_convert_encoding($body, 'UTF-8', $parameter->value);
            }
        }

        return $body;
    }

    private function decode(string $value): string
    {
        return mb_decode_mimeheader($value);
    }

    private function addresses(array $addresses): array
    {
        return collect($addresses)->map(fn (object $address) => [
            'name' => $this->decode($address->personal ?? ''),
            'email' => ($address->mailbox ?? '').'@'.($address->host ?? ''),
        ])->values()->all();
    }

    private function sanitizeHtml(string $html): string
    {
        $document = new DOMDocument;
        @$document->loadHTML('<?xml encoding="utf-8" ?><div id="mail-root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        foreach (['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'] as $tag) {
            while (($nodes = $document->getElementsByTagName($tag))->length) {
                $nodes->item(0)?->parentNode?->removeChild($nodes->item(0));
            }
        }
        foreach ($document->getElementsByTagName('*') as $element) {
            if (! $element instanceof DOMElement) {
                continue;
            }
            foreach (iterator_to_array($element->attributes) as $attribute) {
                $name = strtolower($attribute->name);
                $value = strtolower(trim($attribute->value));
                $unsafeSource = $name === 'src' && ! preg_match('/^(https?:|cid:|data:image\/)/i', $value);
                if ($name === 'style') {
                    $safeStyle = $this->sanitizeInlineStyle($attribute->value);
                    if ($safeStyle === '') {
                        $element->removeAttribute($attribute->name);
                    } else {
                        $element->setAttribute('style', $safeStyle);
                    }

                    continue;
                }
                if (str_starts_with($name, 'on') || $unsafeSource || (in_array($name, ['href', 'src'], true) && str_starts_with($value, 'javascript:'))) {
                    $element->removeAttribute($attribute->name);
                }
            }
            if ($element->tagName === 'a') {
                $element->setAttribute('target', '_blank');
                $element->setAttribute('rel', 'noopener noreferrer');
            }
        }
        $root = $document->getElementById('mail-root');

        return $root ? collect(iterator_to_array($root->childNodes))->map(fn ($node) => $document->saveHTML($node))->implode('') : strip_tags($html);
    }

    private function sanitizeInlineStyle(string $style): string
    {
        $allowed = [
            'background', 'background-color', 'border', 'border-bottom', 'border-collapse',
            'border-color', 'border-left', 'border-radius', 'border-right', 'border-spacing',
            'border-style', 'border-top', 'border-width', 'box-sizing', 'color', 'direction',
            'display', 'float', 'font', 'font-family', 'font-size', 'font-style', 'font-weight',
            'height', 'letter-spacing', 'line-height', 'margin', 'margin-bottom', 'margin-left',
            'margin-right', 'margin-top', 'max-height', 'max-width', 'min-height', 'min-width',
            'opacity', 'overflow', 'overflow-wrap', 'padding', 'padding-bottom', 'padding-left',
            'padding-right', 'padding-top', 'table-layout', 'text-align', 'text-decoration',
            'text-indent', 'text-transform', 'vertical-align', 'white-space', 'width',
            'word-break', 'word-spacing', 'word-wrap',
        ];
        $safe = [];
        foreach (explode(';', $style) as $declaration) {
            if (! str_contains($declaration, ':')) {
                continue;
            }
            [$property, $value] = array_map('trim', explode(':', $declaration, 2));
            $property = strtolower($property);
            if (! in_array($property, $allowed, true) || $value === '') {
                continue;
            }
            if (preg_match('/(?:url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:|-moz-binding)/i', $value)) {
                continue;
            }
            $safe[] = $property.': '.$value;
        }

        return implode('; ', $safe);
    }

    private function folderType(string $folder): string
    {
        $value = strtolower($folder);

        return match (true) {
            $value === 'inbox' => 'inbox',
            str_contains($value, 'sent'), str_contains($value, 'envoy') => 'sent',
            str_contains($value, 'draft'), str_contains($value, 'brouillon') => 'drafts',
            str_contains($value, 'archive') => 'archive',
            str_contains($value, 'trash'), str_contains($value, 'corbeille') => 'trash',
            str_contains($value, 'spam'), str_contains($value, 'junk') => 'spam',
            default => 'folder',
        };
    }

    private function moveToFolderType(mixed $connection, int $uid, string $type, string $fallback): bool
    {
        $folder = $this->findFolderByType($connection, $type) ?? $fallback;
        if (! $this->folderExists($connection, $folder)) {
            $mailbox = $this->server().$folder;
            if (! imap_createmailbox($connection, function_exists('imap_utf7_encode') ? imap_utf7_encode($mailbox) : $mailbox)) {
                return false;
            }
        }

        return imap_mail_move($connection, (string) $uid, $folder, CP_UID);
    }

    private function findFolderByType(mixed $connection, string $type): ?string
    {
        return collect(imap_list($connection, $this->server(), '*') ?: [])
            ->map(function (string $folder): array {
                $name = substr($folder, strlen($this->server()));
                $decoded = function_exists('imap_utf7_decode') ? imap_utf7_decode($name) : $name;

                return ['name' => $name, 'decoded' => $decoded, 'type' => $this->folderType($decoded)];
            })->where('type', $type)
            ->sortBy(fn (array $folder) => $this->folderPreference($folder['decoded'], $type))
            ->value('name');
    }

    private function folderExists(mixed $connection, string $folder): bool
    {
        return collect(imap_list($connection, $this->server(), '*') ?: [])
            ->contains(fn (string $item) => substr($item, strlen($this->server())) === $folder);
    }

    private function folderPreference(string $folder, string $type): int
    {
        $value = strtolower($folder);

        return match ($type) {
            'spam' => str_contains($value, 'spam') ? 0 : 1,
            'sent' => str_contains($value, 'sent') ? 0 : 1,
            'drafts' => str_contains($value, 'draft') ? 0 : 1,
            'archive' => str_contains($value, 'archive') ? 0 : 1,
            'trash' => str_contains($value, 'trash') ? 0 : 1,
            default => 0,
        };
    }

    private function folderOrder(string $type): int
    {
        return match ($type) {
            'inbox' => 0, 'sent' => 1, 'drafts' => 2, 'archive' => 3,
            'trash' => 4, 'spam' => 5, default => 6,
        };
    }
}
