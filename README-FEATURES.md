# Tahlila Application Features

Tahlila is a laboratory information management system (LIMS) that covers the workflow from patient registration and test ordering to sample collection, result publication, invoicing, and patient self-service.

This document is based on the application routes in `routes/web.php`, `routes/lims.php`, `routes/patient.php`, `routes/auth.php`, and `routes/api.php`, together with the controllers used by those routes.

Tahlila is free and open-source software distributed under the [MIT License](LICENSE). Copyright (c) 2026 Developer Community SARL AU.

## Feature overview

### Dashboard

- View a laboratory activity dashboard.
- Access permission-aware shortcuts for common tasks.
- Monitor operational information such as orders, collections, results, and laboratory activity.
- Search and filter records from the relevant workflow screens.

### Patient management

- Create patient records.
- View the patient directory and individual patient details.
- Edit patient identity and contact information.
- Delete patient records when allowed by their relationships and business rules.
- Search for existing patients before creating an order.
- View a patient's complete laboratory order and test history.
- Store patient information including identity card number, date of birth, gender, phone number, email address, and address data.

### Laboratory orders

- Create a new laboratory order for an existing patient.
- Add individual analyses, analysis groups, and categories to an order.
- Edit an existing order and its selected analyses.
- Remove an order.
- Record the order total, amount paid, payment method, and remaining balance or change due.
- Use cash, point-of-sale, bank transfer, or cheque as the payment method.
- Track an order through four workflow stages: draft, pending collection, processing, and ready/completed.
- Open an order directly from patient history, sample collection, results, or invoices according to the user's permissions.

### Sample collection and barcode labels

- View the sample collection worklist.
- Open the collection details for an order.
- Record the collection date and prevent it from being changed after it is finalized.
- Update the collection/workflow status.
- Calculate the collection materials required for the selected medical tests.
- Group validated, shareable collection materials when appropriate.
- Generate barcode-based tube labels.
- Configure the number of label copies per tube.
- Choose a `50x25` or `50x30` tube-label format.
- Save label-printing preferences per order.
- Remove an order from the sample collection workflow when authorized.

### Results management

- View the results worklist and filter it by status.
- Open an order's result entry screen.
- Enter and update result values for each ordered analysis.
- Record secondary result values where an analysis supports them.
- Add a conclusion or interpretation to a result line.
- Compare results with configured units and reference values.
- Autosave result changes from the result document interface.
- Mark an order as ready/completed when its results are finalized.
- Produce a branded laboratory result report.
- Print result reports.
- Download a result report as PDF.
- Email a completed report to a patient or another recipient.

### Invoicing and payments

- View and filter the invoice list.
- Generate a detailed invoice for an order.
- Display the laboratory, patient, order, barcode, line items, totals, payment method, paid amount, balance, and change due.
- Treat draft orders as quotations and active/completed orders as invoices.
- Update paid, remaining, or change amounts.
- Print invoices in a standard document layout.
- Print a compact thermal-receipt version.
- Configure the active currency and tax rate.

### Test and pricing catalog

- Create, edit, view, and delete individual test prices.
- Create, edit, view, and delete test groups.
- Create, edit, view, and delete test categories.
- Associate tests with groups and categories.
- Configure test names, units, reference values, and pricing used in orders and reports.
- Browse the extended medical catalog by medical category and analysis group.
- Inspect specimen types, collection tubes, parameters, and pending reference-range validations.
- Install selected medical tests or complete analysis groups into the laboratory's active catalog.
- Track the latest medical-catalog installation.

### Inventory management

- View laboratory stock items.
- Create a stock product.
- Edit product information and quantities.
- Delete a stock product.
- Restrict inventory operations to users with inventory-management permission.

### Patient portal

- Enable or disable the patient portal from laboratory settings.
- Automatically prepare portal accounts for patients who have a unique email address.
- Provide a separate patient login that does not grant staff access.
- Allow patients to request a password-reset link and set a new password.
- Allow authenticated patients to log out securely.
- Show each patient a personal dashboard with order, ready-result, and processing counts.
- Show the patient's own order history and payment summary.
- Allow patients to open only their own completed results.
- Prevent patients from accessing another patient's data or unpublished results.
- Apply the laboratory branding, language, currency, and color theme to the portal.

### Internal staff chat

- Start one-to-one conversations with other staff members.
- Send text messages of up to 5,000 characters.
- Attach up to five files to a message.
- Support images, PDF files, Word documents, Excel/CSV files, and text files up to 10 MB each.
- Display unread-message counts.
- Mark received messages as read when a conversation is opened.
- Load recent conversation history.
- Preview permitted image attachments inline and download other attachments securely.
- Ensure that only the sender or recipient can access a chat attachment.

### Email and mailbox

- Send email from inside the application.
- Address messages with To, CC, and BCC recipients.
- Add a subject and formatted message body.
- Attach up to ten files of up to 10 MB each.
- Reply to an existing email message.
- Browse mailbox messages through the configured email account.
- Open an individual message and download its attachments.
- Mark messages as read or unread.
- Star or unstar messages.
- Archive or delete messages.
- Send test results and generated PDF reports by email.
- Configure outgoing SMTP and incoming IMAP email settings.
- Run automatic email configuration where supported.

### Staff, roles, and permissions

- View the staff directory.
- Create staff accounts with a name, email address, password, and role.
- Edit staff accounts, roles, permissions, and passwords.
- Delete staff accounts while preventing a user from deleting their own active account.
- Use the built-in Administrator, Laboratory Technician, and Reception roles.
- Assign custom permissions to roles/users where supported.
- Control access independently for the dashboard, patients, orders, collections, results, invoices, catalog, inventory, chat, staff, email, and settings.
- Hide inaccessible navigation and protect the corresponding server routes.

### Authentication and account security

- Sign in and sign out staff users.
- Keep authenticated browser sessions alive during application use.
- Request and complete a forgotten-password reset.
- Verify staff email addresses through signed, rate-limited links.
- Resend an email-verification notification.
- Require password confirmation for sensitive actions.
- Change the current password after verifying the existing password.
- Update profile information.
- Delete the current account after the required confirmation checks.
- Enable time-based one-time password (TOTP) two-factor authentication.
- Confirm two-factor setup with an authenticator code.
- Complete a two-factor challenge during login.
- Generate and regenerate recovery codes.
- Disable two-factor authentication after password confirmation.
- Rate-limit sensitive login, reset, installation, and verification operations.

### Laboratory settings and branding

- Configure the laboratory name, managing director, phone, fax, email, and address.
- Store company and tax identification numbers.
- Upload a laboratory logo.
- Configure report and invoice footer text.
- Configure accepted payment methods, currency, and tax.
- Customize application brand colors using validated hexadecimal colors.
- Reset colors to the default theme.
- Configure the patient portal.
- Access license and application-update screens.

### Languages and localization

- View installed languages.
- Activate the application's current language.
- Edit language translations.
- Support locale dictionaries with fallback text.
- Display localized dates, labels, statuses, and currency throughout the staff and patient interfaces.
- Configure the initial language during installation.

### Guided installation

- Create the first administrator account through a rate-limited setup step.
- Configure the laboratory identity and contact details.
- Select the initial language, currency, and tax rate.
- Enable the standard payment methods during setup.
- Mark installation as complete and enter the main application.

### React application data endpoints

- Serve all staff and patient pages as normal browser routes.
- Expose session-authenticated JSON mirrors under `/api/lims/...` for client-side React navigation.
- Protect the JSON endpoints with the same authentication, email-verification, patient-isolation, and permission rules as their browser equivalents.
- Expose the authenticated user through the Sanctum-protected `/api/user` endpoint.
- Refresh CSRF tokens and recover safely from expired form sessions.

## Access-control matrix

| Permission | Capabilities |
| --- | --- |
| `dashboard.view` | View the operational dashboard |
| `patients.manage` | Manage patients and patient history |
| `orders.manage` | Create, edit, and delete laboratory orders |
| `collection.manage` | Manage collection status, dates, barcodes, and labels |
| `results.manage` | Enter, finalize, print, and download results |
| `invoices.manage` | View invoices and manage settlement information |
| `catalog.manage` | Manage prices, tests, groups, categories, and medical-catalog installation |
| `inventory.manage` | Manage stock products |
| `chat.use` | Use internal staff chat |
| `staff.manage` | Manage users, roles, and permissions |
| `email.send` | Use email, mailbox, and report-email functions |
| `settings.manage` | Manage laboratory, payment, branding, language, portal, and system settings |

The Administrator role has full access. The Laboratory Technician role is oriented toward patients, orders, collection, results, inventory, and chat. The Reception role is oriented toward patients, orders, collection, invoices, and chat.

## Main route groups

| Area | Main routes |
| --- | --- |
| Dashboard | `/`, `/dashboard` |
| Patients | `/patients`, `/patients/{id}`, `/history/patient/{id}` |
| Orders | `/new-test`, `/tests`, `/tests/{id}` |
| Collection | `/sample-collection`, `/sample-collection/{id}` |
| Results and reports | `/results`, `/results/{id}/edit`, `/print/result/{id}`, `/reports/{test}/pdf` |
| Invoices | `/invoices`, `/invoice/{id}` |
| Catalog | `/prices`, `/categories`, `/groups`, `/setting/medical-catalog` |
| Inventory | `/stocks`, `/product/create`, `/product/{id}/edit` |
| Communication | `/chat`, `/email` |
| Staff | `/staff`, `/staff/create`, `/staff/{id}/edit` |
| Settings | `/settings`, `/setting/*`, `/languages`, `/update` |
| Profile and security | `/profile`, `/two-factor-challenge`, `/verify-email` |
| Patient portal | `/patient/login`, `/patient/dashboard`, `/patient/results/{id}` |
| Installation | `/install/account`, `/install/setup` |

## Important implementation notes

- Most staff features require authentication and a verified email address.
- Every protected functional area is guarded by a dedicated server-side permission.
- Patient portal access is isolated from staff authentication and can be disabled globally.
- Browser pages and their `/api/lims` JSON equivalents represent the same features; the JSON routes are not separate public APIs.
- Public staff self-registration is disabled. The first administrator is created during installation, and additional staff accounts are created by an authorized staff administrator.
