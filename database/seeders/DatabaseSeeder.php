<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Group;
use App\Models\Patient;
use App\Models\Price;
use App\Models\Role;
use App\Models\Stock;
use App\Models\Test;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            foreach ([
                ['name' => 'Tahlila Administrator', 'email' => 'admin@tahlila.test', 'role' => 'administrator'],
                ['name' => 'Reception Desk', 'email' => 'reception@tahlila.test', 'role' => 'reception'],
            ] as $user) {
                User::updateOrCreate(['email' => $user['email']], [
                    'name' => $user['name'], 'password' => Hash::make('password'), 'email_verified_at' => now(),
                    'role_id' => Role::where('slug', $user['role'])->value('id'),
                ]);
            }

            $categories = collect(['Hematology', 'Biochemistry', 'Immunology'])
                ->mapWithKeys(fn (string $name) => [$name => Category::updateOrCreate(['category_name' => $name])]);
            $groups = collect(['Routine Blood Tests', 'Liver Function', 'Kidney Function'])
                ->mapWithKeys(fn (string $name) => [$name => Group::updateOrCreate(['group_name' => $name])]);

            $prices = collect([
                ['name' => 'Complete Blood Count', 'description' => 'Red cells, white cells, hemoglobin and platelets.', 'unit' => 'cells/µL', 'reference' => '4,000–10,000', 'price' => 120, 'category' => 'Hematology', 'group' => 'Routine Blood Tests'],
                ['name' => 'Hemoglobin', 'description' => 'Blood hemoglobin concentration.', 'unit' => 'g/dL', 'reference' => '12–17', 'price' => 60, 'category' => 'Hematology', 'group' => 'Routine Blood Tests'],
                ['name' => 'Fasting Blood Glucose', 'description' => 'Glucose level after an overnight fast.', 'unit' => 'mg/dL', 'reference' => '70–100', 'price' => 80, 'category' => 'Biochemistry', 'group' => 'Routine Blood Tests'],
                ['name' => 'ALT', 'description' => 'Alanine transaminase liver enzyme test.', 'unit' => 'U/L', 'reference' => '7–56', 'price' => 90, 'category' => 'Biochemistry', 'group' => 'Liver Function'],
                ['name' => 'Creatinine', 'description' => 'Kidney filtration marker.', 'unit' => 'mg/dL', 'reference' => '0.6–1.3', 'price' => 90, 'category' => 'Biochemistry', 'group' => 'Kidney Function'],
                ['name' => 'TSH', 'description' => 'Thyroid-stimulating hormone test.', 'unit' => 'mIU/L', 'reference' => '0.4–4.0', 'price' => 150, 'category' => 'Immunology', 'group' => 'Routine Blood Tests'],
            ])->map(function (array $data) use ($categories, $groups): Price {
                $price = Price::updateOrCreate(['test_name' => $data['name']], [
                    'test_description' => $data['description'], 'test_unit' => $data['unit'],
                    'test_reference_value' => $data['reference'], 'price' => $data['price'],
                ]);
                $price->categories()->syncWithoutDetaching([$categories[$data['category']]->id]);
                $price->groups()->syncWithoutDetaching([$groups[$data['group']]->id]);

                return $price;
            })->keyBy('test_name');

            $patients = collect([
                ['id_card' => 'MA-10001', 'firstname' => 'Amina', 'lastname' => 'El Idrissi', 'date_of_birth' => '1992-04-18', 'gender' => 'Female', 'phone' => '0612345678', 'email' => 'amina.elidrissi@example.test'],
                ['id_card' => 'MA-10002', 'firstname' => 'Youssef', 'lastname' => 'Bennani', 'date_of_birth' => '1985-11-02', 'gender' => 'Male', 'phone' => '0623456789', 'email' => 'youssef.bennani@example.test'],
                ['id_card' => 'MA-10003', 'firstname' => 'Salma', 'lastname' => 'Amrani', 'date_of_birth' => '2001-07-29', 'gender' => 'Female', 'phone' => '0634567890', 'email' => 'salma.amrani@example.test'],
                ['id_card' => 'MA-10004', 'firstname' => 'Omar', 'lastname' => 'Fassi', 'date_of_birth' => '1978-01-14', 'gender' => 'Male', 'phone' => '0645678901', 'email' => 'omar.fassi@example.test'],
            ])->mapWithKeys(fn (array $data) => [$data['id_card'] => Patient::updateOrCreate(['id_card' => $data['id_card']], $data)]);

            foreach ([
                ['patient' => 'MA-10001', 'status' => 'completed', 'payment' => 'cash', 'date' => now()->subDays(2), 'items' => ['Complete Blood Count' => ['value' => '7,400', 'conclusion' => 'Within reference range'], 'Hemoglobin' => ['value' => '13.8', 'conclusion' => 'Within reference range']]],
                ['patient' => 'MA-10002', 'status' => 'in treatment', 'payment' => 'pos', 'date' => now()->subDay(), 'items' => ['Fasting Blood Glucose' => ['value' => '108', 'conclusion' => 'Slightly above reference range'], 'Creatinine' => ['value' => '1.0', 'conclusion' => 'Within reference range']]],
                ['patient' => 'MA-10003', 'status' => 'not yet screened', 'payment' => 'cash', 'date' => now(), 'items' => ['TSH' => ['value' => null, 'conclusion' => null]]],
            ] as $order) {
                $patient = $patients[$order['patient']];
                $total = collect(array_keys($order['items']))->sum(fn (string $name) => (float) $prices[$name]->price);
                $test = Test::updateOrCreate(
                    ['patient_id' => $patient->id, 'prelevement_date' => $order['date']->toDateString()],
                    ['total_price' => $total, 'payment_method' => $order['payment'], 'paid_amount' => $total, 'remaining_or_give' => 0, 'test_status' => $order['status']],
                );
                foreach ($order['items'] as $name => $result) {
                    DB::table('test_for_patients')->updateOrInsert(
                        ['test_id' => $test->id, 'price_id' => $prices[$name]->id],
                        ['test_result_value' => $result['value'], 'patient_age' => now()->diffInYears($patient->date_of_birth), 'conclusion' => $result['conclusion'], 'created_at' => now(), 'updated_at' => now()],
                    );
                }
            }

            foreach ([
                ['product_name' => 'EDTA Tubes', 'product_color' => 'Purple', 'quantity' => '200', 'quantity_used' => '35'],
                ['product_name' => 'Serum Tubes', 'product_color' => 'Red', 'quantity' => '150', 'quantity_used' => '28'],
                ['product_name' => 'Disposable Gloves', 'product_color' => 'Blue', 'quantity' => '500', 'quantity_used' => '120'],
            ] as $item) {
                Stock::updateOrCreate(['product_name' => $item['product_name']], $item);
            }
        });

        $this->call(MedicalCatalogSeeder::class);
    }
}
