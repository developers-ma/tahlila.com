# Tahlila Lab

Tahlila Lab is a laboratory information management system (LIMS) built with Laravel and React. It supports the operational workflow from patient registration and laboratory ordering to sample collection, result publication, invoicing, email delivery, and patient self-service.

The application is designed for laboratories that need a permission-controlled staff workspace, printable clinical and administrative documents, an integrated medical catalog, and a separate patient portal.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Features](README-FEATURES.md) | Complete application capabilities, permissions, and route groups |
| [Web installation](README-INSTALLATION-WEB.md) | Server requirements, local setup, production deployment, updates, and troubleshooting |
| [User guide](README-USE-TAHLILA-LAB.md) | Initial configuration and daily use by administrators, receptionists, technicians, and patients |

## Contents

- [Main features](#main-features)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [First-time setup](#first-time-setup)
- [Using the application](#using-the-application)
- [Roles and permissions](#roles-and-permissions)
- [Configuration](#configuration)
- [Testing](#testing)
- [Production deployment](#production-deployment)
- [Updating an installation](#updating-an-installation)
- [Project architecture](#project-architecture)
- [Desktop distribution](#desktop-distribution)
- [Security and data protection](#security-and-data-protection)
- [Known limitations](#known-limitations)

## Main features

- Dashboard with laboratory activity, recent orders, performance indicators, and permission-aware quick actions.
- Patient registration, search, editing, history, and patient-specific order creation.
- Laboratory orders containing individual analyses, groups, or categories.
- Four-stage workflow: Quote, To collect, Processing, and Ready.
- Sample collection dates, required materials, barcodes, and configurable tube labels.
- Result entry with primary and secondary values, units, references, conclusions, and autosave support.
- Branded result reports with browser printing, PDF download, and email delivery.
- Invoices, quotations, settlements, balances, change due, standard printing, and thermal printing.
- Medical catalog installation by discipline, group, analysis, parameters, materials, and pricing.
- Management of tests, prices, groups, categories, and stock products.
- Integrated SMTP/IMAP mailbox and secure one-to-one staff chat.
- Staff accounts, built-in roles, and granular server-side permissions.
- Separate patient portal for order tracking and access to completed results.
- Laboratory identity, payment, language, translation, color, email, and portal settings.
- Password recovery, email verification, TOTP two-factor authentication, and recovery codes.
- React navigation backed by session-authenticated Laravel JSON endpoints.

See [README-FEATURES.md](README-FEATURES.md) for the complete feature inventory.

## Technology stack

| Layer | Technology |
| --- | --- |
| Backend | PHP 8.2+ and Laravel 11 |
| Frontend | React 19, React Router 7, and TypeScript |
| Asset build | Vite 7 and Node.js 22 LTS |
| Styling | Tailwind CSS 3 and application CSS |
| Database | MySQL or MariaDB recommended; SQLite is used by automated tests |
| Authentication | Laravel sessions, email verification, Sanctum, and TOTP 2FA |
| Documents | Dompdf, SVG barcodes, and QR codes |
| Communication | SMTP, IMAP, and internal staff chat |
| Production runtime | Nginx or Apache with PHP-FPM |

Laravel serves the React application and its data. Node.js is required to build the frontend assets but is not required on the production server when the compiled `public/build` directory is deployed.

## Requirements

- PHP 8.2 or newer.
- Composer 2.
- MySQL 8+ or a compatible MariaDB version.
- Node.js 22 LTS and npm.
- Nginx or Apache for production.
- PHP extensions required by Laravel and the installed packages, including PDO MySQL, DOM, Fileinfo, GD, OpenSSL, and XML.
- PHP IMAP extension when the integrated mailbox is used.

Verify the local toolchain:

```sh
php -v
composer --version
node -v
npm -v
```

Detailed requirements and web-server examples are available in [README-INSTALLATION-WEB.md](README-INSTALLATION-WEB.md).

## Quick start

### 1. Install dependencies

```sh
composer install
npm ci
```

### 2. Create the environment file

```sh
cp .env.example .env
php artisan key:generate
```

Configure the database and application URL in `.env`:

```dotenv
APP_NAME=Tahlila
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tahlila
DB_USERNAME=tahlila
DB_PASSWORD=your-database-password
```

### 3. Prepare the database and storage

```sh
php artisan migrate
php artisan storage:link
```

Do not run `php artisan db:seed` on a real laboratory database. The default seeder creates demonstration users, patients, orders, analyses, and inventory data.

### 4. Start development services

Run the frontend development server:

```sh
npm run dev
```

In another terminal, run Laravel:

```sh
php artisan serve --host=127.0.0.1 --port=8000
```

Open:

```text
http://127.0.0.1:8000/install/account
```

### Compiled local or LAN mode

To test the compiled application without the Vite development server:

```sh
npm run build
php artisan serve --host=0.0.0.0 --port=8000
```

On another device, open the server's LAN IP address instead of `localhost`. Set `APP_URL` to the address used by the browser, set `SESSION_SECURE_COOKIE=false` for local HTTP, leave `SESSION_DOMAIN` empty, and run `php artisan config:clear` after changing `.env`.

The `public/hot` file must be absent when using compiled assets so Laravel loads `public/build/manifest.json`.

## First-time setup

The browser-based installer guides the first administrator through the required configuration.

1. Open `/install/account`.
2. Create the first administrator account.
3. Enter laboratory identity, contact, legal, logo, and document-footer information.
4. Select the working language, currency, and tax rate.
5. Select at least one analysis from the reference medical catalog.
6. Complete installation and open the dashboard.

The first password must contain at least ten characters, uppercase and lowercase letters, and numbers.

Public staff registration is disabled. Additional staff accounts are created by an authorized administrator from `/staff`.

For a complete walkthrough, see [README-USE-TAHLILA-LAB.md](README-USE-TAHLILA-LAB.md#1-complete-the-first-installation).

## Using the application

### Recommended configuration order

After installation:

1. Complete the medical catalog at `/setting/medical-catalog`.
2. Verify laboratory identity at `/setting/laboratory`.
3. Configure currency, tax, and payment methods at `/setting/payment`.
4. Configure SMTP and IMAP at `/setting/email`.
5. Select the active language and translations at `/languages`.
6. Configure branding at `/setting/colors`.
7. Create staff accounts and permissions at `/staff`.
8. Test email delivery before enabling `/setting/patient-portal`.

### Daily laboratory workflow

```text
Patient
  → Laboratory order
  → Sample collection and labels
  → Processing and result entry
  → Clinical/technical review
  → Ready result
  → Report, invoice, email, and patient portal
```

The main operational routes are:

| Area | Route |
| --- | --- |
| Dashboard | `/dashboard` |
| Patients | `/patients` |
| New laboratory order | `/new-test` |
| Sample collection | `/sample-collection` |
| Results | `/results` |
| Invoices | `/invoices` |
| Tests and prices | `/prices` |
| Groups | `/groups` |
| Categories | `/categories` |
| Inventory | `/stocks` |
| Internal chat | `/chat` |
| Email mailbox | `/email` |
| Staff | `/staff` |
| Settings | `/settings` |
| Patient login | `/patient/login` |

The complete user manual is available in [README-USE-TAHLILA-LAB.md](README-USE-TAHLILA-LAB.md).

## Roles and permissions

Tahlila includes three default staff roles:

- **Administrator:** full access, including staff and system settings.
- **Laboratory Technician:** patients, orders, collection, results, inventory, chat, and dashboard.
- **Reception:** patients, orders, collection, invoices, chat, and dashboard.

Protected functional areas use dedicated server-side permissions:

| Permission | Area |
| --- | --- |
| `dashboard.view` | Dashboard |
| `patients.manage` | Patients and history |
| `orders.manage` | Laboratory orders |
| `collection.manage` | Collection and labels |
| `results.manage` | Results and reports |
| `invoices.manage` | Invoices and settlements |
| `catalog.manage` | Catalog, tests, groups, categories, and prices |
| `inventory.manage` | Stock products |
| `chat.use` | Internal chat |
| `staff.manage` | Staff, roles, and permissions |
| `email.send` | Email, mailbox, and report delivery |
| `settings.manage` | Laboratory and system configuration |

The navigation hides inaccessible functions, and Laravel middleware independently protects the page, JSON, and write routes.

## Configuration

### Email

SMTP is used to send messages, password-reset links, patient-portal invitations, and result reports. IMAP is used by the integrated mailbox.

Settings can be entered through `/setting/email` or initially through `.env`:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=mailer@example.com
MAIL_PASSWORD=your-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=mailer@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

The application also provides automatic email-server discovery. Providers using two-step verification may require an application password.

### Patient portal

Before enabling the patient portal:

- Configure and test SMTP.
- Set `APP_URL` to the address reachable by patients.
- Verify patient email addresses and remove duplicates.
- Test the completed-result workflow.

Enable the portal at `/setting/patient-portal`. Patients establish their password through the first-access/forgotten-password flow and can view only their own completed results.

### Uploaded files

Run `php artisan storage:link` to expose permitted files stored on the public disk. The web-server account must be able to write to `storage` and `bootstrap/cache`.

Email and chat attachments can be up to 10 MB per file. Configure PHP and the web server with compatible upload and POST limits.

## Demonstration data

Running the default database seeder creates demonstration data, including these staff accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@tahlila.test` | `password` |
| Reception | `reception@tahlila.test` | `password` |

Use these accounts only in an isolated development or demonstration database. Never deploy them to production. The browser installer does not create these demonstration accounts.

## Testing

Build the frontend and run the backend test suite:

```sh
npm run build
php artisan test
```

Run the LIMS workflow capture test and React UI smoke test:

```sh
LIMS_CAPTURE_DIR=/private/tmp/tahlila-ui-tests php artisan test --filter=LimsWorkflowTest
npm run test:ui -- /private/tmp/tahlila-ui-tests
```

PHPUnit uses an in-memory SQLite database. Tests must never be configured to use the live laboratory database.

The UI smoke test uses fictitious data produced by the PHP workflow test. Automated tests do not replace validation in supported browsers, on mobile layouts, or with the laboratory's barcode, label, document, and receipt printers.

PHP 8.5 may display Laravel deprecation warnings related to `PDO::MYSQL_ATTR_SSL_CA`. These warnings originate from the installed framework configuration and are separate from test failures.

## Production deployment

Use Nginx or Apache with PHP-FPM. Do not expose the project root: the web-server document root must point to `public`.

An Nginx example is provided at [`deploy/nginx.conf.example`](deploy/nginx.conf.example). Adapt its hostname, application path, PHP-FPM socket, upload limit, and TLS configuration.

Typical production commands:

```sh
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Recommended production environment settings:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://laboratory.example.com
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=sync
```

The PHP-FPM account needs write access to:

- `storage`
- `bootstrap/cache`
- `lang/*.json` only when administrators are allowed to edit translations in the application

Node.js can be removed from the runtime server when `public/build` has already been generated and deployed.

Read [README-INSTALLATION-WEB.md](README-INSTALLATION-WEB.md) before deploying an internet-facing installation.

## Updating an installation

Back up the database, `.env`, `storage`, and customized translations before every update.

Then deploy the new source and run:

```sh
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Never:

- Replace the existing `.env` without reviewing its values.
- Generate a different `APP_KEY` for an existing installation.
- Run `migrate:fresh` against laboratory data.
- Delete or replace the existing `storage` directory.
- Run demonstration seeders on a production database.

## Project architecture

| Path | Responsibility |
| --- | --- |
| `routes/web.php` | Write actions, settings, communication, profile, and shared web routes |
| `routes/lims.php` | Staff React pages and session-authenticated `/api/lims` JSON mirrors |
| `routes/patient.php` | Separate patient-portal authentication and pages |
| `routes/auth.php` | Staff authentication, verification, and password routes |
| `app/Http/Controllers/LimsPageController.php` | Staff screen data and form schemas |
| `app/Services/SaveLaboratoryOrder.php` | Order validation, price calculation, and transactional persistence |
| `resources/views/react.blade.php` | Laravel host document for the React application |
| `resources/js/lims/` | React pages, shared components, localization, and data contracts |
| `resources/js/lims/messages.json` | Canonical translatable interface strings |
| `config/lims_permissions.php` | Central role and permission registry |
| `database/migrations/` | Database schema and incremental changes |
| `deploy/nginx.conf.example` | Example production Nginx configuration |

React Router changes URLs and loads page data from Laravel without a full document reload. Direct browser access to every route remains supported. Forms retain Laravel sessions, CSRF protection, validation, file uploads, and authorization.

The patient portal uses accounts separate from employee accounts. Public employee registration is disabled, and the legacy `/register` route redirects to the patient login.

## Desktop distribution

This repository remains the source of truth for both the web and Desktop editions. Do not manually copy Laravel or React source files into the sibling `desktop` project. Its build directories and installers are generated.

After changing backend code, routes, migrations, React, CSS, or assets, verify this project first:

```sh
npm run build
php artisan test
```

To publish a Desktop release:

```sh
cd ../desktop
npm test
npm run release
```

The Desktop release process reads this project, builds React, creates a clean production Laravel copy, installs production Composer dependencies, and produces Server and Client applications.

Desktop updates must preserve the user's `.env`, SQLite database, `storage`, and application data. Build Windows installers on Windows and macOS DMG files on macOS. Public macOS distribution requires signing and notarization.

## Security and data protection

- Use HTTPS for every production or internet-facing installation.
- Give each staff member an individual account.
- Enable TOTP two-factor authentication for privileged accounts.
- Follow least privilege when assigning roles and permissions.
- Keep `APP_DEBUG=false` in production.
- Protect `.env`, database backups, email credentials, and `APP_KEY`.
- Verify patient identity before collection, result entry, printing, or release.
- Confirm email recipients before transmitting patient information.
- Validate reference ranges and clinical rules locally before clinical use.
- Back up the database and uploaded files regularly and test restoration.
- Follow applicable health-data privacy, retention, access-control, and breach-notification requirements.

## Known limitations

- The License and Update pages display administered installation information; they do not perform an automatic backend upgrade or remote license activation.
- The historical order schema does not freeze every price and tax value per line. A payment-only change preserves the recorded order total, while changing selected analyses recalculates it from the current catalog.
- Printing tube labels does not automatically decrease stock quantities.
- Email delivery depends on valid SMTP credentials, and mailbox access depends separately on IMAP configuration and the PHP IMAP extension.
- Suggested medical reference ranges and collection-material associations require local professional validation.
- Automated tests do not send real email and do not replace validation with the laboratory's physical printers and devices.

## License and support

Application license and support arrangements are managed by the organization responsible for the Tahlila deployment. Use the in-application maintenance and license screens or contact the deployment administrator for upgrade and support procedures.
