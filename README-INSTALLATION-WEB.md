# Tahlila Web Installation Guide

This guide explains how to install Tahlila as a web application on a local machine, a private network, or a production server.

## Technology stack

| Layer | Technology |
| --- | --- |
| Backend | PHP 8.2+ and Laravel 11 |
| Frontend | React 19, React Router 7, and TypeScript |
| Asset build | Vite 7 and Node.js 22 LTS |
| Styling | Tailwind CSS 3 and application CSS |
| Database | MySQL or MariaDB recommended |
| Authentication | Laravel sessions, email verification, Sanctum, and TOTP 2FA |
| Documents | Dompdf, SVG barcodes, and QR codes |
| Email | SMTP for sending and IMAP for the mailbox |
| Production server | Nginx or Apache with PHP-FPM |

Node.js is required to build the frontend assets. It is not required at runtime when the compiled `public/build` directory is deployed.

## Server requirements

Install the following software:

- PHP 8.2 or newer. PHP 8.3 or 8.4 is recommended for production.
- Composer 2.
- MySQL 8+ or a compatible MariaDB release.
- Node.js 22 LTS and npm for building frontend assets.
- Nginx or Apache for production.
- A valid TLS certificate for an internet-facing deployment.

Required or recommended PHP extensions:

- `ctype`
- `curl`
- `dom`
- `fileinfo`
- `filter`
- `gd`
- `iconv`
- `intl`
- `json`
- `libxml`
- `mbstring`
- `openssl`
- `pdo`
- `pdo_mysql`
- `session`
- `tokenizer`
- `xml`
- `zip`
- `imap` for the integrated mailbox

Confirm that the installed PHP environment satisfies Composer's requirements:

```sh
php -v
composer check-platform-reqs
node -v
npm -v
```

## 1. Download the application

Place the project outside the public web directory. Only the project's `public` directory must be exposed by the web server.

Example production location:

```text
/var/www/tahlila
```

Enter the project directory before running the commands below:

```sh
cd /var/www/tahlila
```

## 2. Install dependencies

For a development installation:

```sh
composer install
npm ci
```

For a production installation:

```sh
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```

The frontend build must finish successfully and create `public/build/manifest.json`.

If assets are built on another machine, use the same lock files and Node.js major version, then deploy the generated `public/build` directory with the application.

## 3. Create the environment file

Create `.env` from the provided template:

```sh
cp .env.example .env
php artisan key:generate
```

Generate `APP_KEY` only for a new installation. Never replace the key of an existing installation because encrypted sessions and other encrypted application data depend on it.

Use production-safe application settings:

```dotenv
APP_NAME=Tahlila
APP_ENV=production
APP_KEY=base64:GENERATED_VALUE
APP_DEBUG=false
APP_URL=https://laboratory.example.com

LOG_CHANNEL=stack
LOG_LEVEL=warning

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
```

Important rules:

- `APP_URL` must match the URL used by staff and patients. It is used in password-reset and patient-portal links.
- Use `SESSION_SECURE_COOKIE=true` with HTTPS.
- Leave `SESSION_DOMAIN` empty for a single hostname unless a shared parent-domain cookie is specifically required.
- Never commit `.env` or disclose `APP_KEY`, database passwords, SMTP credentials, or IMAP credentials.
- Run `php artisan config:clear` after changing `.env` while installing or troubleshooting.

## 4. Create and configure the database

Create a dedicated database and user. The following is an example; choose a strong password and adjust access to your environment:

```sql
CREATE DATABASE tahlila CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tahlila'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON tahlila.* TO 'tahlila'@'localhost';
FLUSH PRIVILEGES;
```

Configure Laravel in `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tahlila
DB_USERNAME=tahlila
DB_PASSWORD=replace-with-a-strong-password
```

Test the configuration and create the schema:

```sh
php artisan config:clear
php artisan migrate --force
```

Do not run `php artisan migrate:fresh` on an existing installation. It deletes all application data.

Do not run `php artisan db:seed` on a real production database. The default seeder creates demonstration users, patients, orders, tests, and stock data. Normal installations use the browser-based setup described below.

## 5. Configure writable directories and public storage

The web-server/PHP-FPM account must be able to write to `storage` and `bootstrap/cache`.

Example for a Debian or Ubuntu server using `www-data`:

```sh
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
php artisan storage:link
```

The storage link exposes uploaded laboratory logos and chat attachments through `public/storage` where appropriate. If `public/storage` already exists, inspect it before replacing it.

The language editor writes to `lang/*.json`. If administrators must edit translations from the application, grant the PHP-FPM account write access to those JSON files as well. Keep the rest of the source tree read-only in production.

## 6. Configure the web server

### Nginx

The repository contains `deploy/nginx.conf.example`. Copy and adapt it for the actual domain, project location, and PHP-FPM socket.

A minimal configuration is:

```nginx
server {
    listen 80;
    server_name laboratory.example.com;
    root /var/www/tahlila/public;
    index index.php;
    charset utf-8;

    client_max_body_size 12m;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /build/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.php {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }

    location ~ \.php$ {
        return 404;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Test and reload Nginx after enabling the site:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

Terminate HTTPS at Nginx or at a trusted reverse proxy, redirect HTTP to HTTPS, and set `APP_URL` to the final HTTPS URL.

### Apache

Set the virtual host's `DocumentRoot` to `/var/www/tahlila/public`, allow overrides for that directory, and enable `mod_rewrite`. The included `public/.htaccess` sends application requests to Laravel's front controller.

Example requirements:

```apache
DocumentRoot /var/www/tahlila/public

<Directory /var/www/tahlila/public>
    AllowOverride All
    Require all granted
</Directory>
```

Never set the document root to the project root. Doing so may expose `.env` and other private files.

### Upload limits

Email and chat attachments can be up to 10 MB per file. Set the web server and PHP limits above that value. For example:

```ini
upload_max_filesize = 12M
post_max_size = 55M
max_file_uploads = 20
```

The larger POST limit allows a chat message with multiple attachments. Reload PHP-FPM after editing `php.ini`.

## 7. Complete the browser-based installation

Open the following URL after migrations and web-server configuration are complete:

```text
https://laboratory.example.com/install/account
```

The guided installer will:

1. Create the first administrator account.
2. Collect the laboratory identity, contact details, legal identifiers, report footer, and optional logo.
3. Select the language, currency, and tax rate.
4. Load the reference medical catalog.
5. Ask the administrator to activate at least one laboratory analysis.
6. Complete the installation and redirect to the dashboard.

The first administrator password must contain at least ten characters, upper- and lowercase letters, and numbers.

Public staff registration is disabled. Additional staff accounts must be created by an authorized administrator from the Staff section.

## 8. Configure email and the patient portal

### Outgoing SMTP

SMTP can initially be configured in `.env`:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=mailer@example.com
MAIL_PASSWORD=replace-with-the-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=mailer@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

Authorized administrators can later configure SMTP and IMAP from the application's email settings screen. Ensure that the PHP `imap` extension is installed before using the integrated mailbox.

### Patient portal

Before enabling the patient portal:

- Confirm that `APP_URL` is publicly reachable by the intended patients.
- Configure and test SMTP.
- Confirm that patient email addresses are correct and unique.
- Enable the portal from **Settings → Patient Portal**.

Patients use the password-reset/first-access email to establish their separate portal password. Patient accounts do not grant access to staff functions.

## 9. Optimize the production application

After configuration is stable, cache Laravel configuration and compiled views:

```sh
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

No queue worker or scheduler is currently required with the default `QUEUE_CONNECTION=sync` configuration. If the application is later changed to use an asynchronous queue, configure a persistent worker separately.

## 10. Verify the installation

Run these checks from the project directory:

```sh
composer check-platform-reqs --no-dev
php artisan migrate:status
php artisan route:list
npm run build
php artisan test
```

Then verify in a browser:

- HTTPS redirects and the login page work.
- The administrator can sign in and see the dashboard.
- A patient, order, sample collection, result, invoice, and report can be created through a test workflow.
- The logo and chat attachments load through `public/storage`.
- Result PDF downloads and barcode/label printing work.
- SMTP sends a test message and IMAP opens the mailbox if those features are enabled.
- Password-reset links use the correct hostname.
- The layout works on desktop and mobile screens.

After verification, remove any temporary clinical or patient data created for the deployment test according to the laboratory's data-handling policy.

## Local development

Install all dependencies and prepare the application:

```sh
composer install
npm ci
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Run Vite and Laravel in separate terminals:

```sh
npm run dev
```

```sh
php artisan serve
```

Open `http://127.0.0.1:8000/install/account` for a new database.

To test the production-style compiled frontend locally, stop Vite, ensure that `public/hot` is absent, and run:

```sh
npm run build
php artisan serve --host=0.0.0.0 --port=8000
```

For LAN access over HTTP, set `APP_URL` to the server's LAN address, set `SESSION_SECURE_COOKIE=false`, leave `SESSION_DOMAIN` empty, and allow port 8000 through the local firewall. Do not use `php artisan serve` as a public production server.

## Updating an existing installation

Back up the database, `.env`, and `storage` directory before every update. Then deploy the new source and run:

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

Do not overwrite the existing `.env`, regenerate `APP_KEY`, delete `storage`, or run destructive migration commands.

## Backup recommendations

A complete backup should include:

- The MySQL/MariaDB database.
- The `.env` file, stored securely and encrypted.
- The full `storage/app` directory.
- Customized `lang/*.json` translation files.
- Any deployment-specific web-server and PHP configuration.

Test restoration regularly on an isolated system. Medical and patient data may be subject to privacy, retention, access-control, and breach-notification requirements in the jurisdiction where the application is operated.

## Troubleshooting

### A 500 error appears after deployment

Check `storage/logs/laravel.log`, confirm the PHP extensions, verify database access, and make sure `storage` and `bootstrap/cache` are writable.

### CSS or JavaScript does not load

Run `npm run build`, confirm that `public/build/manifest.json` exists, and make sure the web server can serve `/build/`. Remove a stale `public/hot` file when using compiled assets.

### Laravel reports that no application key is set

For a new installation, run `php artisan key:generate`. For an existing installation, restore the original `APP_KEY` instead of generating a different one.

### Uploaded images or attachments do not load

Run `php artisan storage:link`, verify the `public/storage` symbolic link, and check filesystem ownership and permissions.

### Forms return an expired-page or CSRF error

Confirm that `APP_URL`, HTTPS, `SESSION_SECURE_COOKIE`, `SESSION_DOMAIN`, and the reverse-proxy configuration agree with the URL in the browser. Then run `php artisan optimize:clear`.

### Emails contain incorrect links

Set `APP_URL` to the exact public URL and rebuild the configuration cache with `php artisan config:cache`.

### The mailbox fails while SMTP still works

SMTP and IMAP are separate services. Install/enable the PHP `imap` extension and verify the IMAP hostname, port, encryption, certificate validation, username, and password.

### Uploads larger than a few megabytes fail

Increase Nginx `client_max_body_size` or the Apache equivalent, plus PHP's `upload_max_filesize` and `post_max_size`, then reload the affected services.
