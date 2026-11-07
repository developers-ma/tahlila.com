<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ChatMessage;
use App\Models\ColorSetting;
use App\Models\EmailSetting;
use App\Models\Group;
use App\Models\LaboratorySetting;
use App\Models\Patient;
use App\Models\PatientAccount;
use App\Models\PaymentMethod;
use App\Models\Price;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Stock;
use App\Models\Test;
use App\Models\User;
use App\Services\MailboxService;
use Illuminate\Http\Request;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Picqer\Barcode\BarcodeGeneratorSVG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Throwable;

/** Read models for the React UI. Writes continue through the existing Laravel controllers. */
class LimsPageController extends Controller
{
    private function field(string $name, string $label, string $type = 'text', bool $required = false, array $options = []): array
    {
        return compact('name', 'label', 'type', 'required', 'options');
    }

    public function __invoke(Request $request)
    {
        $page = $this->data(
            $request,
            (string) $request->route('screen'),
            $this->routeId($request),
        );

        if ($request->expectsJson()) {
            return response()->json($page)->header('Cache-Control', 'private, no-store');
        }

        return response()->view('react', compact('page'))->header('Cache-Control', 'private, no-store');
    }

    public function json(Request $request)
    {
        $page = $this->data(
            $request,
            (string) $request->route('screen'),
            $this->routeId($request),
        );
        $path = preg_replace('#^api/lims#', '', $request->path());
        $page['path'] = '/'.ltrim($path ?: '/', '/');
        if (($page['rows'] ?? null) instanceof AbstractPaginator) {
            $page['rows']->withPath($page['path']);
        }

        return response()->json($page)->header('Cache-Control', 'private, no-store');
    }

    private function routeId(Request $request): mixed
    {
        return collect($request->route()->parameters())
            ->except(['screen', 'token'])
            ->first();
    }

    private function data(Request $request, string $screen, mixed $id): array
    {
        $locale = app()->getLocale();
        $dictionaryPath = preg_match('/^[a-zA-Z-]+$/', $locale) ? base_path("lang/$locale.json") : '';
        $dictionary = $dictionaryPath && File::exists($dictionaryPath) ? json_decode(File::get($dictionaryPath), true) : [];
        $currentUser = $request->user()?->loadMissing('role');
        $page = ['screen' => $screen, 'locale' => $locale, 'dictionary' => $dictionary, 'title' => 'Laboratoire',
            'user' => $currentUser ? [...$currentUser->only('id', 'name', 'email'), 'role' => $currentUser->role?->name, 'avatarUrl' => $currentUser->profilePhotoUrl()] : null,
            'permissions' => $currentUser?->permissionKeys() ?? [], 'isAdministrator' => $currentUser?->isAdministrator() ?? false,
            'unreadChatCount' => $currentUser ? ChatMessage::where('recipient_id', $currentUser->id)->whereNull('read_at')->count() : 0,
            'patientPortalEnabled' => (bool) Setting::value('patient_portal_enabled'),
            'csrf' => csrf_token(), 'errors' => collect(session('errors')?->getBags() ?? [])->flatMap(fn ($bag) => $bag->toArray())->all(),
            'old' => collect($request->old())->except(['password', 'password_confirmation', 'current_password', 'mail_password', '_token'])->all(),
            'flash' => session('success') ?? session('status') ?? session('error'),
            'currency' => PaymentMethod::value('currency') ?: 'MAD',
            'laboratory' => LaboratorySetting::first(), 'path' => '/'.ltrim($request->path(), '/'),
            'theme' => ColorSetting::whereColumn('updated_at', '!=', 'created_at')->first()];

        $resources = [
            'patients' => [Patient::class, 'Patients', 'patients', [
                $this->field('firstname', 'Prénom', 'text', true), $this->field('lastname', 'Nom', 'text', true),
                $this->field('gender', 'Sexe', 'select', true, ['1' => 'Homme', '2' => 'Femme', 'Male' => 'Homme (ancien libellé)', 'Female' => 'Femme (ancien libellé)']),
                $this->field('date_of_birth', 'Date de naissance', 'date', true),
                $this->field('has_insurance', 'Assurance maladie', 'checkbox'),
                $this->field('is_child', 'Enfant / Identité du parent', 'checkbox'),
                $this->field('id_card', 'Identité / CIN', 'text', true),
                $this->field('parent_id_card', 'Identité / CIN du parent'),
                $this->field('phone', 'Téléphone', 'tel', true), $this->field('email', 'E-mail', 'email'),
            ]],
            'categories' => [Category::class, 'Catégories', 'categories', [$this->field('category_name', 'Nom de la catégorie', 'text', true)]],
            'groups' => [Group::class, 'Groupes d’analyses', 'groups', [$this->field('group_name', 'Nom du groupe', 'text', true)]],
            'stocks' => [Stock::class, 'Stocks & consommables', 'product', [
                $this->field('product_name', 'Produit', 'text', true), $this->field('product_color', 'Couleur', 'color'),
                $this->field('quantity', 'Quantité totale', 'number', true), $this->field('quantity_used', 'Quantité utilisée', 'number'),
            ]],
            'prices' => [Price::class, 'Catalogue des analyses', 'prices', [
                $this->field('test_name', 'Nom de l’analyse', 'text', true), $this->field('price', 'Prix', 'number', true),
                $this->field('test_description', 'Description', 'textarea', true),
                $this->field('test_unit', 'Unité', 'text', true), $this->field('test_reference_value', 'Valeurs de référence', 'text', true),
                $this->field('test_unit_2', 'Deuxième unité'), $this->field('test_reference_value_2', 'Deuxième référence'),
                $this->field('categories', 'Catégories', 'multiple', false, Category::pluck('category_name', 'id')->all()),
                $this->field('groups', 'Groupes', 'multiple', false, Group::pluck('group_name', 'id')->all()),
                $this->field('test_required_age', 'Demander l’âge', 'checkbox'), $this->field('test_required_weight', 'Demander le poids', 'checkbox'),
                $this->field('test_required_height', 'Demander la taille', 'checkbox'), $this->field('test_requiring_conclusion', 'Conclusion', 'checkbox'),
            ]],
        ];
        $resource = explode('.', $screen)[0];
        if (isset($resources[$resource])) {
            [$model, $title, $base, $fields] = $resources[$resource];
            $page += compact('fields', 'base');
            $page['title'] = $title;
            $page['resource'] = $resource;
            if (str_contains($screen, '.')) {
                $record = $id ? $model::findOrFail($id) : null;
                $page['kind'] = 'form';
                $page['title'] = ($id ? 'Modifier · ' : 'Ajouter · ').$title;
                $page['record'] = $record?->toArray() ?? [];
                if ($record instanceof Patient) {
                    $page['record']['date_of_birth'] = $record->date_of_birth?->format('Y-m-d');
                }
                if ($record instanceof Price) {
                    $page['record']['categories'] = $record->categories()->pluck('categories.id');
                    $page['record']['groups'] = $record->groups()->pluck('groups.id');
                }
                $page['action'] = '/'.$base.($id ? '/'.$id.($resource === 'stocks' ? '/edit' : '') : ($resource === 'stocks' ? '/create' : ''));
                $page['method'] = $id ? 'PUT' : 'POST';
            } else {
                $query = $model::query();
                if ($search = $request->string('q')->toString()) {
                    $names = array_column(array_filter($fields, fn ($f) => in_array($f['type'], ['text', 'tel', 'email'])), 'name');
                    $query->where(function ($q) use ($names, $search) {
                        foreach ($names as $name) {
                            $q->orWhere($name, 'like', '%'.$search.'%');
                        }
                    });
                }
                $page['kind'] = 'resource';
                $page['rows'] = $query->latest('id')->paginate(20)->withQueryString();
            }
        } elseif ($screen === 'patient-history') {
            $patient = Patient::findOrFail($id);
            $page['title'] = $patient->firstname.' '.$patient->lastname.' · Historique';
            $page['patientId'] = $patient->id;
            $page['rows'] = Test::with('patient')->where('patient_id', $patient->id)->latest('id')->paginate(20)->withQueryString();
        } elseif (in_array($screen, ['dashboard', 'results', 'invoices', 'sample-collection'])) {
            $page['title'] = ['dashboard' => 'Une journée bien organisée.', 'results' => 'Résultats', 'invoices' => 'Factures & règlements', 'sample-collection' => 'Prélèvements & codes-barres'][$screen];
            $query = Test::with('patient');
            if ($screen === 'results') {
                $query->select('tests.*')
                    ->selectSub(
                        DB::table('test_for_patients as result_lines')
                            ->selectRaw('COUNT(*)')
                            ->whereColumn('result_lines.test_id', 'tests.id'),
                        'result_lines_count'
                    )
                    ->selectSub(
                        DB::table('test_for_patients as completed_lines')
                            ->join('prices as result_prices', 'result_prices.id', '=', 'completed_lines.price_id')
                            ->selectRaw('COUNT(*)')
                            ->whereColumn('completed_lines.test_id', 'tests.id')
                            ->whereNotNull('completed_lines.test_result_value')
                            ->where('completed_lines.test_result_value', '!=', '')
                            ->where(function ($completed) {
                                $completed->whereNull('result_prices.test_unit_2')
                                    ->orWhere('result_prices.test_unit_2', '')
                                    ->orWhere(function ($secondResult) {
                                        $secondResult->whereNotNull('completed_lines.test_result_value_2')
                                            ->where('completed_lines.test_result_value_2', '!=', '');
                                    });
                            }),
                        'completed_result_lines_count'
                    );
            }
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where(fn ($query) => $query->where('id', $q)->orWhereHas('patient', fn ($p) => $p->where('firstname', 'like', "%$q%")->orWhere('lastname', 'like', "%$q%")->orWhere('id_card', 'like', "%$q%")));
            }
            if (in_array($request->query('status'), ['0', '1', '2', '3'], true)) {
                $query->where('test_status', $request->query('status'));
            }
            $page['rows'] = $query->latest('id')->paginate(15)->withQueryString();
            $page['stats'] = ['patients' => Patient::count(), 'waiting' => Test::where('test_status', '1')->count(), 'processing' => Test::where('test_status', '2')->count(), 'ready' => Test::where('test_status', '3')->count(), 'paid' => Test::sum('paid_amount'), 'balance' => Test::where('remaining_or_give', '>', 0)->sum('remaining_or_give')];
            if ($screen === 'dashboard') {
                $page['stats']['analyses'] = DB::table('test_for_patients')->count();
                $page['stats']['stock'] = Stock::sum('quantity');
                $page['stats']['revenue'] = Test::sum('total_price');
                foreach (['day' => '%Y-%m-%d', 'month' => '%Y-%m', 'year' => '%Y'] as $period => $format) {
                    $expression = DB::connection()->getDriverName() === 'sqlite' ? "strftime('$format', created_at)" : "DATE_FORMAT(created_at, '$format')";
                    $page['analytics'][$period] = Test::selectRaw("$expression as label, COUNT(*) as count, SUM(total_price) as revenue")->groupBy('label')->orderBy('label')->get();
                }
            }
        } elseif (in_array($screen, ['order', 'invoice', 'barcode', 'report', 'result'])) {
            $test = $id ? Test::with('patient')->findOrFail($id) : null;
            $page['title'] = ['order' => $id ? 'Modifier le dossier #'.$id : 'Nouveau dossier', 'invoice' => 'Facture #'.$id, 'barcode' => 'Prélèvement #'.$id, 'report' => 'Compte rendu #'.$id, 'result' => 'Saisie des résultats · #'.$id][$screen];
            $page['record'] = $test;
            $page['lines'] = $test ? DB::table('test_for_patients as lines')->leftJoin('prices', 'prices.id', '=', 'lines.price_id')->leftJoin('groups', 'groups.id', '=', 'lines.group_id')->leftJoin('categories', 'categories.id', '=', 'lines.category_id')->where('lines.test_id', $test->id)->select('prices.*', 'lines.*', 'groups.group_name', 'categories.category_name')->get() : [];
            $page['payment'] = PaymentMethod::first();
            if ($screen === 'order') {
                $page['patients'] = Patient::orderBy('lastname')->orderBy('firstname')
                    ->get(['id', 'firstname', 'lastname', 'id_card', 'phone', 'email']);
                $page['selectedPatient'] = $test?->patient_id ?? $request->query('patient');
                if (! $test && ! $page['selectedPatient']) {
                    $page['screen'] = 'patient-select';
                    $page['title'] = 'Sélectionner un patient';
                } else {
                    $page['catalogue'] = Price::with(['categories', 'groups'])->orderBy('test_name')->get();
                    $page['categories'] = Category::all();
                    $page['groups'] = Group::all();
                }
            }
            if ($test) {
                $generator = new BarcodeGeneratorSVG;
                $page['barcode'] = $generator->getBarcode((string) $test->id, $generator::TYPE_CODE_128);
                if ($screen === 'barcode') {
                    $page['qrcode'] = (string) QrCode::format('svg')->size(70)->generate((string) $test->id);
                }
            }
            if ($screen === 'barcode') {
                $page['stocks'] = Stock::all();
            }
        } elseif ($screen === 'settings') {
            $page['title'] = 'Votre laboratoire, à votre manière.';
        } elseif (str_starts_with($screen, 'setting.')) {
            $section = substr($screen, 8);
            $page['kind'] = 'form';
            $page['method'] = 'POST';
            $page['action'] = '/setting/'.$section;
            $page['resource'] = 'settings';
            if ($section === 'payment') {
                $page['title'] = 'Paiements & devise';
                $page['record'] = PaymentMethod::first();
                $page['fields'] = [$this->field('currency', 'Devise', 'text', true), $this->field('tax', 'Taxe (%)', 'number', true), $this->field('cash', 'Espèces', 'checkbox'), $this->field('pos', 'Carte bancaire', 'checkbox'), $this->field('bank_transfer', 'Virement', 'checkbox'), $this->field('cheque', 'Chèque', 'checkbox')];
            } elseif ($section === 'laboratory') {
                $page['title'] = 'Identité du laboratoire';
                $page['record'] = LaboratorySetting::first();
                $page['action'] = '/laboratory-settings';
                $labels = ['laboratory_name' => 'Nom du laboratoire', 'managing_director' => 'Directeur', 'phone' => 'Téléphone', 'fax' => 'Fax', 'email' => 'E-mail', 'address' => 'Adresse', 'company_number' => 'Registre de commerce', 'tax_id' => 'Identifiant fiscal', 'footer_title1' => 'Pied de page 1', 'footer_title2' => 'Pied de page 2', 'footer_title3' => 'Pied de page 3'];
                $page['fields'] = [];
                foreach ($labels as $name => $label) {
                    $page['fields'][] = $this->field($name, $label, $name === 'email' ? 'email' : 'text', $name !== 'fax');
                }
                $page['fields'][] = $this->field('logo', 'Logo du laboratoire', 'file');
            } elseif ($section === 'email') {
                $page['title'] = 'Messagerie du laboratoire';
                $page['record'] = EmailSetting::first()?->toArray() ?? [];
                $page['record']['send_email'] = $page['record']['email_notification'] ?? 'false';
                $page['fields'] = [];
                foreach (['mail_host' => 'Serveur SMTP', 'mail_port' => 'Port SMTP', 'mail_username' => 'Identifiant SMTP', 'mail_password' => 'Nouveau mot de passe SMTP (vide : conserver)', 'mail_from_address' => 'Adresse d’expédition', 'mail_from_name' => 'Nom de l’expéditeur', 'mail_encryption' => 'Chiffrement SMTP', 'imap_host' => 'Serveur IMAP', 'imap_port' => 'Port IMAP', 'imap_username' => 'Identifiant IMAP', 'imap_password' => 'Nouveau mot de passe IMAP (vide : conserver)', 'imap_encryption' => 'Chiffrement IMAP', 'imap_validate_cert' => 'Vérifier le certificat du serveur'] as $name => $label) {
                    $type = str_contains($name, 'password') ? 'password' : ($name === 'imap_validate_cert' ? 'checkbox' : 'text');
                    $page['fields'][] = $this->field($name, $label, $type, ! in_array($name, ['mail_password', 'mail_encryption', 'imap_password']));
                }
                $page['fields'][] = $this->field('send_email', 'Notification des résultats', 'checkbox');
            } elseif ($section === 'colors') {
                $page['title'] = 'Couleurs du laboratoire';
                $page['record'] = ColorSetting::first();
                $page['fields'] = [];
                foreach (['primary', 'secondary', 'tertiary', 'neutral', 'background', 'font', 'success', 'info', 'warning', 'error'] as $color) {
                    $page['fields'][] = $this->field($color.'_color', ucfirst($color), 'color', true);
                }
            } elseif ($section === 'patient-portal') {
                $page['title'] = 'Espace patient';
                $page['record'] = ['patient_portal_enabled' => (bool) Setting::value('patient_portal_enabled')];
                $page['fields'] = [$this->field('patient_portal_enabled', 'Activer l’espace patient', 'checkbox')];
                $page['portalStats'] = [
                    'patientsWithEmail' => Patient::whereNotNull('email')->where('email', '!=', '')->count(),
                    'accounts' => PatientAccount::count(),
                    'activated' => PatientAccount::whereNotNull('password')->count(),
                ];
            } else {
                $page['kind'] = 'info';
                $page['title'] = 'Licence';
                $page['message'] = 'Aucun service de gestion de licence n’est configuré dans cette application. Contactez votre administrateur pour les informations de licence.';
            }
        } elseif ($screen === 'chat') {
            $page['title'] = 'Chat interne';
            $users = User::with('role:id,name')->whereKeyNot($currentUser->id)->orderBy('name')->get(['id', 'role_id', 'name', 'email', 'profile_photo_path']);
            $unread = ChatMessage::where('recipient_id', $currentUser->id)->whereNull('read_at')->selectRaw('sender_id, COUNT(*) as total')->groupBy('sender_id')->pluck('total', 'sender_id');
            $page['chatUsers'] = $users->map(function (User $user) use ($currentUser, $unread): array {
                $last = ChatMessage::where(fn ($query) => $query->where('sender_id', $currentUser->id)->where('recipient_id', $user->id))
                    ->orWhere(fn ($query) => $query->where('sender_id', $user->id)->where('recipient_id', $currentUser->id))->latest('id')->first();

                return [...$user->only('id', 'name', 'email'), 'role' => $user->role?->name, 'avatarUrl' => $user->profilePhotoUrl(), 'unreadCount' => (int) ($unread[$user->id] ?? 0), 'lastMessage' => $last?->body, 'lastMessageAt' => $last?->created_at?->toAtomString()];
            })->values();
            $selectedId = $request->integer('user') ?: ($page['chatUsers']->first()['id'] ?? null);
            $selected = $users->firstWhere('id', $selectedId);
            $page['chatSelectedUser'] = $selected ? [...$selected->only('id', 'name', 'email'), 'role' => $selected->role?->name, 'avatarUrl' => $selected->profilePhotoUrl()] : null;
            if ($selected) {
                ChatMessage::where('sender_id', $selected->id)->where('recipient_id', $currentUser->id)->whereNull('read_at')->update(['read_at' => now()]);
                $page['chatMessages'] = ChatMessage::where(fn ($query) => $query->where('sender_id', $currentUser->id)->where('recipient_id', $selected->id))
                    ->orWhere(fn ($query) => $query->where('sender_id', $selected->id)->where('recipient_id', $currentUser->id))->with('attachments')->latest('id')->limit(150)->get()->reverse()->values();
            } else {
                $page['chatMessages'] = [];
            }
        } elseif ($screen === 'staff') {
            $page['title'] = 'Équipe du laboratoire';
            $page['users'] = User::with('role:id,name,slug')->orderBy('name')
                ->get(['id', 'role_id', 'name', 'email', 'permissions', 'profile_photo_path', 'created_at'])
                ->map(function (User $user): array {
                    $data = $user->only('id', 'role_id', 'name', 'email', 'created_at');
                    $data['role'] = $user->role?->only('id', 'name', 'slug');
                    $data['permissions'] = $user->permissionKeys();
                    $data['avatarUrl'] = $user->profilePhotoUrl();

                    return $data;
                });
        } elseif (in_array($screen, ['staff.create', 'staff.edit'], true)) {
            $member = $id ? User::with('role')->findOrFail($id) : null;
            $page['title'] = $member ? 'Modifier les accès · '.$member->name : 'Ajouter un collaborateur';
            $page['record'] = $member
                ? [...$member->only('id', 'name', 'email', 'role_id'), 'permissions' => $member->permissionKeys()]
                : ['permissions' => []];
            $page['roles'] = Role::orderBy('id')->get(['id', 'name', 'slug', 'description', 'permissions']);
            $page['permissionGroups'] = collect(config('lims_permissions.permissions'))
                ->map(fn (array $permission, string $key) => ['key' => $key, ...$permission])
                ->groupBy('group')->values();
            $page['action'] = $member ? '/staff/'.$member->id : '/staff';
            $page['method'] = $member ? 'PUT' : 'POST';
        } elseif ($screen === 'email') {
            $page['title'] = 'Messagerie';
            $settings = EmailSetting::first();
            $page['mailConfigured'] = $settings?->mailboxConfigured() ?? false;
            $page['mailAccount'] = $settings ? ['email' => $settings->mail_from_address, 'name' => $settings->mail_from_name] : null;
            $page['mailbox'] = ['folders' => [], 'messages' => ['data' => [], 'total' => 0, 'page' => 1, 'lastPage' => 1], 'selected' => null];
            if ($page['mailConfigured']) {
                try {
                    $mailbox = MailboxService::fromSettings($settings);
                    $folder = $request->string('folder', 'INBOX')->toString() ?: 'INBOX';
                    $page['mailbox']['folder'] = $folder;
                    $page['mailbox']['folders'] = $mailbox->folders();
                    $page['mailbox']['messages'] = $mailbox->messages($folder, $request->string('q')->toString(), max(1, $request->integer('page', 1)));
                    if ($uid = $request->integer('uid')) {
                        $page['mailbox']['selected'] = $mailbox->message($uid, $folder);
                    }
                } catch (Throwable $exception) {
                    report($exception);
                    $page['mailboxError'] = $exception->getMessage();
                }
            }
        } elseif ($screen === 'languages') {
            $page['title'] = 'Langues & traductions';
            $page['languages'] = collect(File::files(base_path('lang')))->filter(fn ($f) => $f->getExtension() === 'json')->map(fn ($f) => $f->getBasename('.json'))->values();
            $page['activeLanguage'] = DB::table('settings')->value('default_language');
        } elseif ($screen === 'language') {
            abort_unless(preg_match('/^[a-zA-Z-]+$/', $id) && File::exists(base_path("lang/$id.json")), 404);
            $page['title'] = 'Traductions · '.$id;
            $page['language'] = $id;
            $page['translations'] = json_decode(File::get(base_path("lang/$id.json")), true);
            foreach (json_decode(File::get(resource_path('js/lims/messages.json')), true) as $french => $key) {
                $page['translations'][$key] ??= $id === 'fr' ? $french : $key;
            }
        } elseif ($screen === 'update') {
            $page['title'] = 'Maintenance & mises à jour';
            $page['kind'] = 'info';
            $page['message'] = 'Les mises à jour sont déployées par votre administrateur. La version actuelle ne dispose pas de service de mise à jour automatique.';
            $manifest = public_path('build/manifest.json');
            $page['updateInfo'] = [
                'applicationVersion' => (string) config('app.version', '1.0.0'),
                'frameworkVersion' => app()->version(),
                'phpVersion' => PHP_VERSION,
                'maintenanceMode' => app()->isDownForMaintenance(),
                'automaticUpdates' => false,
                'lastDeployment' => File::exists($manifest)
                    ? date(DATE_ATOM, File::lastModified($manifest))
                    : null,
            ];
        } elseif ($screen === 'profile') {
            $page['title'] = 'Profil & sécurité';
            $page['twoFactor'] = [
                'enabled' => (bool) $currentUser?->two_factor_confirmed_at,
                'pending' => (bool) ($currentUser?->two_factor_secret && ! $currentUser?->two_factor_confirmed_at),
                'recoveryCodes' => session('two_factor_recovery_codes', []),
            ];
            if ($page['twoFactor']['pending']) {
                $uri = app(\App\Services\TotpService::class)->provisioningUri($currentUser->two_factor_secret, $currentUser->email);
                $page['twoFactor']['secret'] = $currentUser->two_factor_secret;
                $page['twoFactor']['qrCode'] = (string) QrCode::format('svg')->size(220)->margin(1)->generate($uri);
            }
        } elseif ($screen === 'newtest') {
            $page['title'] = 'Commençons par le patient.';
        } elseif (str_starts_with($screen, 'auth.')) {
            $page['title'] = 'Bienvenue dans votre laboratoire';
            $page['token'] = $request->route('token');
            $page['email'] = $request->query('email');
        } else {
            abort(404);
        }

        return $page;
    }
}
