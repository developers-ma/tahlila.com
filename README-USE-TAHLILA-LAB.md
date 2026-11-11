# How to Use Tahlila Lab

This user guide explains how to complete the initial setup and operate the Tahlila laboratory information management system (LIMS).

Tahlila is free and open-source software distributed under the [MIT License](LICENSE). Copyright (c) 2026 Developer Community SARL AU.

It is intended for laboratory administrators, reception staff, and laboratory technicians. The screens visible to each user depend on their assigned permissions.

## About the URLs in this guide

The examples below use:

```text
http://127.0.0.1:8000
```

Your installation may instead use port `8001`, a LAN address, or a production domain such as `https://lab.example.com`. Keep the route after the hostname unchanged. For example:

```text
http://127.0.0.1:8000/staff
https://lab.example.com/staff
```

Both addresses open the same Staff screen when they point to the correct Tahlila server.

## Recommended first-use order

For a new laboratory, configure Tahlila in this order:

1. Create the first administrator through `/install/account`.
2. Complete the guided laboratory setup.
3. Install analyses and set prices in the medical catalog.
4. Confirm the laboratory, payment, language, appearance, and email settings.
5. Create staff accounts and assign permissions.
6. Add or import the first patients.
7. Create laboratory orders.
8. Collect samples and print tube labels.
9. Enter and validate results.
10. Print or email reports and invoices.
11. Enable the patient portal after email delivery has been tested.

## 1. Complete the first installation

### Create the first administrator

Open:

```text
http://127.0.0.1:8000/install/account
```

Enter the administrator's:

- Full name.
- Email address and email confirmation.
- Password and password confirmation.

The password must be at least ten characters and contain uppercase letters, lowercase letters, and numbers.

Select the button to create the account. Tahlila signs in the new administrator and opens the setup wizard. This page is available only while no staff user exists.

### Enter laboratory information

In the Laboratory step, enter:

- Official laboratory name.
- Managing director or responsible biologist.
- Phone and optional fax number.
- Laboratory email address.
- Full address.
- Company/registration number.
- Tax identifier.
- Three footer lines for invoices and reports.
- An optional laboratory logo.

The logo must be an image of no more than 2 MB. These details appear on patient documents, invoices, reports, and application branding, so verify them carefully.

### Select preferences

Choose:

- The working language.
- The accounting currency: MAD, EUR, USD, GBP, or CAD during initial setup.
- The applicable tax percentage from 0 to 100.

The installer enables the standard payment methods: cash, point of sale, bank transfer, and cheque. They can be changed later under payment settings.

### Select the initial medical catalog

The installer loads the medical reference catalog. Select at least one analysis before completing installation. You can return to the full catalog assistant later from:

```text
/setting/medical-catalog
```

After completing the wizard, Tahlila opens the dashboard.

## 2. Sign in and navigate

Staff sign in at:

```text
/login
```

Enter the staff email address and password. If two-factor authentication is enabled, enter the temporary six-digit code from the authenticator application on the next screen.

The main navigation is organized into:

- **Overview:** dashboard and activity.
- **Laboratory:** patients, sample collection, results, and invoices.
- **Management:** tests/catalog, stocks, internal chat, email, and staff.
- **Settings:** laboratory configuration and account security.

An item is hidden when the signed-in user does not have its permission. Entering its URL directly does not bypass server-side access control.

Use the user menu to open the profile, settings, or sign out. Always sign out on a shared computer.

## 3. Dashboard

Open:

```text
/dashboard
```

The dashboard provides an operational summary of the laboratory. Depending on permissions, it displays:

- Recent laboratory orders.
- Activity and performance indicators.
- Analysis counts or revenue over time.
- Quick actions such as creating an order or entering results.
- Direct links to pending sample collection and other worklists.

Use the dashboard as the starting point for daily work. Figures reflect the data currently recorded in Tahlila.

## 4. Configure the medical catalog

Open:

```text
http://127.0.0.1:8000/setting/medical-catalog
```

This assistant installs analyses from the medical reference catalog into the laboratory's active commercial catalog.

### Step 1: Choose disciplines

- Select only the medical categories offered by the laboratory.
- Use **Select all** or **Deselect all** when appropriate.
- Each card indicates how many analyses belong to that category.

### Step 2: Select groups

- Choose the analysis panels or groups the laboratory offers.
- Selecting a group automatically selects its analyses.
- A partially selected group indicates that only some of its analyses are selected.

### Step 3: Refine analyses

- Search by analysis name, code, or abbreviation.
- Select or deselect individual analyses.
- Review the category, group, specimen type, and number of parameters.

### Step 4: Configure prices

- Enter a non-negative price for each selected analysis.
- Enter independent package prices for selected groups when the laboratory sells them as panels.
- All amounts use the currency configured under Payment settings.

### Step 5: Review and install

Review the number of selected categories, groups, analyses, parameters, prices, and reference ranges awaiting validation.

Optional collection-material controls allow the administrator to:

- Install missing tubes and collection materials.
- Associate suggested tubes with analyses.

Select **Install** only after reviewing the summary. The operation can be run again without creating duplicate catalog records, and existing customizations are preserved.

Medical safety note: suggested reference intervals and critical thresholds are not automatically considered clinically validated. A qualified laboratory professional must validate locally applicable reference information before clinical use.

### Maintain tests, groups, and categories

The installed commercial catalog is managed from:

- `/prices` — analyses and prices.
- `/groups` — analysis panels/groups.
- `/categories` — analysis categories.

Use **Create** to add a record, the edit action to update it, and delete only when the item is no longer needed and its relationships permit deletion. Test definitions may include the name, description, units, secondary units, reference values, price, groups, and categories.

Changing a catalog price affects future calculations. Existing orders retain their recorded total unless their selected analyses are changed.

## 5. Configure every Settings section

Open the Settings control center:

```text
/settings
```

Only users with `settings.manage` can access administrative settings.

### Medical catalog

Route:

```text
/setting/medical-catalog
```

Use this section to install disciplines, groups, analyses, parameters, collection materials, and initial prices. Follow the medical-catalog procedure above.

### Laboratory identity

Route:

```text
/setting/laboratory
```

This section contains four groups:

- **Public identity:** laboratory name and managing director.
- **Contact details:** phone, fax, email, and address.
- **Legal information:** company number and tax identifier.
- **Documents and signature:** logo and three document-footer lines.

Select **Save** after making changes. Updated information is used on reports, invoices, emails, and other patient documents.

### Payments and currency

Route:

```text
/setting/payment
```

Configure:

- Currency used in prices, invoices, and dashboards.
- Tax percentage.
- Cash availability.
- Point-of-sale/card availability.
- Bank-transfer availability.
- Cheque availability.

Enable only the payment methods accepted by the laboratory. Save the form before creating new orders with the new configuration.

### Email configuration

Route:

```text
/setting/email
```

Tahlila offers automatic and manual setup.

For automatic setup:

1. Select **Connect your email** or **Reconfigure email**.
2. Enter the laboratory email address.
3. Enter its email password or provider-specific application password.
4. Optionally enter the sender name.
5. Select **Detect and configure**.

For Gmail or another provider with two-step verification, use an application password when required by the provider.

For manual setup, configure:

- SMTP host, port, encryption, username, and password.
- IMAP host, port, encryption, username, and password.
- IMAP certificate validation.
- Sender email address and sender name.
- Automatic patient email notification preference.

Leaving an already configured password field empty preserves the saved password. Prefer TLS and certificate validation unless the email administrator has a specific reason to use another configuration.

After saving, open `/email` and test both sending and receiving before enabling patient notifications.

### Languages and translations

Route:

```text
/languages
```

The page lists installed languages and identifies the active language.

- Search for a language.
- Select **Activate** to make it the laboratory's working language.
- Select **Translations** to edit that language's labels.
- Choose left-to-right or right-to-left text direction.
- Search the translation dictionary and edit individual values.
- Select **Save translations**.

Translation changes affect interface wording. They do not translate clinical content entered manually by users.

### Appearance

Route:

```text
/setting/colors
```

Configure the interface palette:

- Primary, secondary, and tertiary colors.
- Neutral, background, and font colors.
- Success, information, warning, and error colors.

Choose a provided palette or enter valid hexadecimal colors. Use the preview to check readability, then save. **Reset colors** restores the application defaults after confirmation.

### Patient portal

Route:

```text
http://127.0.0.1:8000/setting/patient-portal
```

Before enabling the portal:

1. Configure and test SMTP.
2. Set the correct public `APP_URL` on the server.
3. Verify each patient's email address.
4. Resolve duplicate patient email addresses.
5. Complete and validate at least one result workflow for testing.

Enable **Patient online access** and save. Tahlila prepares portal accounts for patients with a valid, unique email address.

Patients then use:

```text
/patient/login
```

For first access, the patient selects the forgotten-password/first-access link, enters the email recorded in the patient file, and follows the email link to define a password.

Patients can see only their own orders and completed results. Disabling the portal prevents portal access but does not delete laboratory patient records.

### Profile and security

Route:

```text
/profile
```

Users can:

- Update their name, email, and profile photo.
- Change their password by entering the current password.
- Enable two-factor authentication with a TOTP-compatible application.
- Scan the displayed QR code and confirm setup with a six-digit code.
- Save recovery codes in a secure offline location.
- Generate new recovery codes after password confirmation.
- Disable two-factor authentication after password confirmation.
- Permanently delete their own account from the sensitive-actions section.

Account deletion is irreversible. An administrator should first ensure that account removal will not interrupt laboratory operations.

### Staff

Route:

```text
/staff
```

Staff management is described in detail in the next section.

### Maintenance and license information

Routes:

```text
/update
/setting/license
```

These screens display installation, version, deployment, license, and support information. Application updates are administered at server/deployment level; the displayed maintenance screen does not replace database backups and a controlled deployment process.

## 6. Manage staff, roles, and permissions

Open:

```text
http://127.0.0.1:8000/staff
```

The Staff page shows laboratory users, roles, permission summaries, and account actions. Use the search field to find a colleague by name, email, or role.

### Create a staff account

1. Select **Add staff member**.
2. Enter the full name and email address.
3. Enter and confirm a secure password.
4. Select the main role.
5. Review the permissions inherited from that role.
6. Adjust permissions if the selected role supports explicit customization.
7. Save the account.

Built-in roles are:

- **Administrator:** full current and future access.
- **Laboratory Technician:** dashboard, patients, orders, collection, results, inventory, and internal chat.
- **Reception:** dashboard, patients, orders, collection, invoices, and internal chat.

Available permissions control dashboard, patients, orders, collection, results, invoices, catalog, inventory, chat, staff, email, and settings separately.

Use **Select all**, **Clear all**, or **Reset to role** when configuring a non-administrator account. Follow the principle of least privilege: grant only the access required for the person's work.

### Edit or delete staff

- Select the edit action to change identity, role, permissions, or optionally the password.
- Leave the password empty during editing to preserve the current password.
- Delete an account only after confirming it is no longer required.
- A signed-in user cannot delete their own active account from the Staff list.

## 7. Manage patients

Open:

```text
/patients
```

### Create a patient

1. Select **Create patient**.
2. Enter the identity-card or patient identifier.
3. Enter first and last name.
4. Enter date of birth and gender.
5. Add phone and email contact information.
6. Complete any insurance, child-identity, or other available patient fields.
7. Save the record.

Use the search field before creating a patient to reduce duplicate records. Email must be accurate and unique if the patient will use the portal.

### Patient actions

From the patient list, authorized users can:

- Edit patient information.
- Open patient history.
- Start a new laboratory order for the patient.
- Delete the patient when allowed.

Patient history shows the laboratory orders associated with that person. Correct identity information before producing reports or invoices.

## 8. Create and manage laboratory orders

Start at:

```text
/new-test
```

### Select a patient

- Search by patient name or identifier.
- Select the intended patient.
- If the patient does not exist, open **New patient**, save the record, and return to order creation.

### Select analyses

On the order screen:

1. Confirm the patient.
2. Search the active catalog.
3. Select individual analyses, groups, or categories as offered by the screen.
4. Review the order summary and calculated total.
5. Remove accidental selections before saving.

The server recalculates prices from the active catalog and does not trust a total entered only in the browser.

### Record payment and status

Choose an enabled payment method and enter the amount paid. Select the initial status:

- **Quote:** the order is a quotation and has not entered collection workflow.
- **To collect:** the sample is waiting for collection.
- **Processing:** collection/work is underway.
- **Ready:** results are finalized and can be released.

Normally a new accepted order starts as **To collect**. Use **Quote** when preparing an estimate that is not yet an active laboratory order.

Save the order. Authorized users can later edit its analyses, payment information, or status. Changing the analysis selection recalculates the total; changing payment alone preserves the recorded historical total.

## 9. Collect samples and print labels

Open:

```text
http://127.0.0.1:8000/sample-collection
```

The worklist shows orders relevant to collection. Search or filter by status, then open the intended order.

### Verify the order

Before collection:

- Confirm the patient's full name and identifier.
- Confirm the requested analyses.
- Review suggested tubes and collection materials.
- Follow the laboratory's patient-identification and specimen-collection procedure outside the software.

### Record collection

1. Select the appropriate order status.
2. Enter the collection date.
3. Save the collection.

The collection date becomes final after it is recorded and cannot be changed through the normal interface. Verify it before saving.

### Prepare tube labels

In **Prepare tubes**:

- Review each required tube/material and its associated analyses.
- Set the number of label copies for each tube.
- Choose the `50 × 25 mm` or `50 × 30 mm` format.
- Save the print settings.
- Use **Control and print** to preview labels.
- Confirm the preview, printer, paper size, scale, and orientation before printing.

Attach each label according to the laboratory's specimen-identification procedure. Printing labels does not automatically decrease inventory quantities.

## 10. Enter and release results

Open:

```text
/results
```

Filter the worklist and open the intended order.

For each analysis:

1. Confirm the patient and order.
2. Enter the primary result using the displayed unit.
3. Enter a secondary result when that analysis defines a second unit/value.
4. Review the displayed reference information.
5. Enter a conclusion or interpretation when required.
6. Save the result line.

The result interface may autosave changes, but wait for the saved confirmation and resolve any displayed validation error before leaving the page.

When all results have been technically and clinically reviewed, change the order status to **Ready**. Only ready/completed orders can produce the final report and be viewed by patients in the portal.

Do not use reference values or catalog suggestions as a substitute for validation by a qualified laboratory professional.

## 11. Print, download, or email a result report

Open a ready order and select its report, or use:

```text
/print/result/{order-id}
```

The report includes laboratory identity, patient details, analyses, values, units, reference information, and conclusions.

Available actions include:

- **Print / PDF:** opens the browser print workflow.
- **Download PDF:** downloads the generated PDF report.
- **Email report:** sends the report as an attachment.

To email a report:

1. Confirm the recipient address.
2. Review the subject.
3. Review the message.
4. Select **Send**.

Email delivery requires valid SMTP settings. Confirm patient consent and the recipient address before transmitting medical information.

## 12. Manage invoices and payments

Open:

```text
/invoices
```

Search or filter the invoice list, then open an order at:

```text
/invoice/{order-id}
```

The document shows:

- Invoice or quotation number.
- Laboratory and patient identity.
- Order barcode/reference.
- Billed analyses.
- Total, paid amount, outstanding amount, or change due.
- Payment method and payment state.

Use **Update payment** to record the amount received and save the settlement. The document indicates whether it is paid, partially paid, or unpaid.

Use the standard print action for an A4-style document or the thermal print action for a compact receipt. A draft/quote order is displayed as a quotation rather than a finalized invoice.

## 13. Use the integrated email mailbox

Open:

```text
http://127.0.0.1:8000/email
```

If email is not configured, select **Connect email** and complete the setup wizard, or open `/setting/email` for manual configuration.

### Read and organize messages

- Select a mailbox folder.
- Search within messages.
- Use pagination to navigate longer lists.
- Select a message to read it.
- Download attachments only when the sender and content are trusted.
- Choose whether to display remote images; they are blocked initially for privacy.
- Mark a message read or unread.
- Star or unstar a message.
- Archive or delete a message.

Deleting from the trash may be permanent depending on the email server. Confirm the folder and message before deletion.

### Compose an email

1. Select **New message**.
2. Enter the recipient.
3. Add CC or BCC if required.
4. Enter the subject and message.
5. Add permitted attachments if needed.
6. Review recipients and attachments.
7. Select **Send**.

The composer accepts up to ten attachments, each up to 10 MB. Server upload limits may impose a lower limit if deployment configuration is incomplete.

Use **Reply** or **Reply all** from an opened message to retain conversation context. Do not transmit patient information to an unverified address.

## 14. Use internal staff chat

Open:

```text
/chat
```

- Search for a colleague.
- Select the colleague to open a one-to-one conversation.
- Enter a message and send it.
- Attach supported images, PDFs, documents, spreadsheets, CSV, or text files.
- View unread-message indicators.
- Open or download attachments shared within the conversation.

Up to five attachments of 10 MB each can be added to one chat message. Only the sender and recipient can access its attachments.

Internal chat is still part of the laboratory information system. Apply the same confidentiality rules used for other patient and operational data.

## 15. Manage inventory

Open:

```text
/stocks
```

Authorized users can:

- Create a stock product.
- Record its name, color, available quantity, and quantity used.
- Edit quantities and product information.
- Delete an obsolete product after confirmation.

Tahlila does not automatically reduce stock when tube labels are printed. Staff must update actual consumption through the inventory workflow.

## 16. Patient instructions

Patients use a separate portal and must not use the staff login.

### First access or forgotten password

1. Open `/patient/login`.
2. Select the first-access/forgotten-password link.
3. Enter the same email address stored in the patient record.
4. Open the reset email.
5. Follow the link and create a new password.
6. Return to `/patient/login` and sign in.

If the email does not arrive, staff should verify that the portal is enabled, SMTP is working, `APP_URL` is correct, and the patient's email is unique and correctly entered.

### Patient dashboard

At `/patient/dashboard`, patients can:

- See counts for orders, ready results, and work in progress.
- Review their own laboratory-order history.
- Review payment summaries.
- Open completed results.

Results that are not marked **Ready** cannot be opened. A patient cannot access another patient's result by changing the URL.

### Patient result

At `/patient/results/{order-id}`, the patient can review a completed result and use the print action. Staff should explain that the portal does not replace medical interpretation by the requesting clinician.

## 17. Status and workflow reference

| Status | Meaning | Typical next action |
| --- | --- | --- |
| Quote | Estimate, not yet active for collection | Confirm the order and move it to To collect |
| To collect | Sample has not yet been collected | Identify the patient, collect, date, and label the sample |
| Processing | Sample is collected or analyses are underway | Enter and review results |
| Ready | Results are finalized for release | Print, download, email, invoice, or expose through the patient portal |

Use statuses consistently because worklists, report availability, and patient-portal visibility depend on them.

## 18. Permission reference

| Permission | What it allows |
| --- | --- |
| `dashboard.view` | View the dashboard |
| `patients.manage` | Manage patients and patient history |
| `orders.manage` | Create, edit, and delete laboratory orders |
| `collection.manage` | Manage sample collection and labels |
| `results.manage` | Enter, finalize, and publish results |
| `invoices.manage` | Manage invoices and settlements |
| `catalog.manage` | Manage analyses, groups, categories, prices, and catalog installation |
| `inventory.manage` | Manage stock products |
| `chat.use` | Use internal chat |
| `staff.manage` | Manage staff and permissions |
| `email.send` | Use email and send reports |
| `settings.manage` | Change laboratory and system settings |

If a user cannot see a screen or receives a forbidden response, an administrator should review the user's role and permissions at `/staff/{user-id}/edit`.

## 19. Daily operating checklist

### Opening the laboratory

- Sign in with an individual staff account.
- Check the dashboard and unread internal messages.
- Review orders waiting for collection.
- Confirm printers, labels, and network access are working.
- Check email only if it is part of the assigned role.

### During the day

- Search before creating duplicate patients.
- Confirm patient identity before every collection and result entry.
- Keep order statuses current.
- Verify collection dates before saving.
- Review each result before marking an order Ready.
- Confirm email recipients before sending patient information.
- Update inventory usage according to laboratory procedure.

### Closing the laboratory

- Review uncollected and processing orders.
- Confirm ready results have been released according to policy.
- Review unpaid or partially paid invoices when assigned.
- Sign out from shared computers.
- Follow the organization's database and document-backup procedure.

## 20. Common user issues

### I cannot see a navigation item

The account probably does not have the required permission. Ask an administrator to review the account under `/staff`.

### A result report is unavailable

Open the result record and confirm that the order status is **Ready**. Reports remain locked before finalization.

### The patient cannot sign in

Confirm that the patient portal is enabled, the email is correct and unique, and the patient has completed the first-access password flow.

### Email does not send or the mailbox does not load

Open `/setting/email`. SMTP controls sending; IMAP controls receiving. Test and correct the relevant connection settings.

### Labels do not fit the printer

Confirm the saved label format, printer paper size, browser scale, margins, and orientation. Print a non-clinical test label before routine use.

### My changes were rejected

Read the validation message displayed beside the affected field. Correct the data and save again. If the session expired, Tahlila normally refreshes its CSRF token automatically; sign in again if authentication has expired.

### A collection date is wrong after saving

Collection dates are intentionally final after recording. Contact an authorized administrator and follow the laboratory's correction/audit procedure rather than creating an undocumented workaround.

## Safety and privacy reminders

- Give every staff member an individual account; do not share administrator credentials.
- Enable two-factor authentication for privileged accounts.
- Grant only the permissions required for each role.
- Verify patient identity before collection, result release, printing, or email transmission.
- Validate reference ranges and clinical rules locally before use.
- Use HTTPS outside a trusted local development environment.
- Lock or sign out of unattended workstations.
- Back up the database and uploaded files regularly.
- Follow applicable medical-data privacy, retention, consent, and audit requirements.
