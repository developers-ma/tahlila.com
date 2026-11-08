<?php

namespace App\Http\Controllers;

use App\Models\{ApplicationInstallation,LaboratorySetting,PaymentMethod,Role,Setting,User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth,DB,File,Hash};
use Illuminate\Validation\Rules\Password;
use Database\Seeders\MedicalCatalogSeeder;

class InstallationController extends Controller
{
    public function account()
    {
        if (User::exists()) return Auth::check() ? redirect('/install/setup') : redirect('/login');
        return view('installer', ['installer'=>['screen'=>'account','csrf'=>csrf_token()]]);
    }

    public function createAccount(Request $request)
    {
        abort_if(User::exists(), 409, 'Le premier administrateur existe déjà.');
        $data=$request->validate([
            'name'=>['required','string','max:255'],
            'email'=>['required','email','max:255','confirmed','unique:users,email'],
            'password'=>['required','confirmed',Password::min(10)->letters()->mixedCase()->numbers()],
        ]);
        $user=DB::transaction(function() use($data){
            // Legacy migrations create presentation defaults. A genuine first run
            // must start with empty laboratory data supplied by its owner.
            LaboratorySetting::query()->delete();
            PaymentMethod::query()->delete();
            $role=Role::where('slug','administrator')->firstOrFail();
            $user=User::create(['name'=>$data['name'],'email'=>strtolower($data['email']),'email_verified_at'=>now(),'password'=>Hash::make($data['password']),'role_id'=>$role->id]);
            ApplicationInstallation::updateOrCreate(['id'=>1],['current_step'=>'laboratory','administrator_id'=>$user->id,'completed_at'=>null]);
            app(MedicalCatalogSeeder::class)->run();
            return $user;
        });
        Auth::login($user); $request->session()->regenerate();
        return response()->json(['redirect'=>'/install/setup']);
    }

    public function setup(Request $request)
    {
        $installation=ApplicationInstallation::firstOrCreate(['id'=>1],['current_step'=>'laboratory','administrator_id'=>$request->user()->id]);
        if ($installation->completed_at) return redirect('/dashboard');
        $languages=collect(File::files(base_path('lang')))->filter(fn($f)=>$f->getExtension()==='json')->map(fn($f)=>$f->getBasename('.json'))->sort()->values();
        return view('installer',['installer'=>[
            'screen'=>'setup','csrf'=>csrf_token(),'step'=>$installation->current_step,
            'laboratory'=>LaboratorySetting::first(), 'payment'=>PaymentMethod::first(),
            'language'=>Setting::value('default_language') ?: 'fr','languages'=>$languages,
        ]]);
    }

    public function saveLaboratory(Request $request)
    {
        $data=$request->validate([
            'laboratory_name'=>'required|string|max:255','managing_director'=>'required|string|max:255','phone'=>'required|string|max:30','fax'=>'nullable|string|max:30',
            'email'=>'required|email|max:255','address'=>'required|string|max:500','company_number'=>'required|string|max:50','tax_id'=>'required|string|max:50',
            'footer_title1'=>'required|string|max:255','footer_title2'=>'required|string|max:255','footer_title3'=>'required|string|max:255','logo'=>'nullable|image|max:2048',
        ]);
        $data['fax']=$data['fax']??'';
        if($request->hasFile('logo')) $data['logo']=$request->file('logo')->store('logos','public');
        LaboratorySetting::updateOrCreate(['id'=>1],$data);
        ApplicationInstallation::whereKey(1)->update(['current_step'=>'preferences']);
        return response()->json(['message'=>'Informations du laboratoire enregistrées.']);
    }

    public function savePreferences(Request $request)
    {
        $data=$request->validate(['language'=>'required|regex:/^[a-zA-Z-]+$/','currency'=>'required|string|in:MAD,EUR,USD,GBP,CAD','tax'=>'required|numeric|min:0|max:100']);
        abort_unless(File::exists(base_path('lang/'.$data['language'].'.json')),422,'Langue indisponible.');
        Setting::updateOrCreate(['id'=>1],['default_language'=>$data['language']]);
        PaymentMethod::updateOrCreate(['id'=>1],['cash'=>'true','pos'=>'true','bank_transfer'=>'true','cheque'=>'true','currency'=>$data['currency'],'tax'=>$data['tax']]);
        ApplicationInstallation::whereKey(1)->update(['current_step'=>'catalog']);
        return response()->json(['message'=>'Préférences enregistrées.']);
    }

    public function complete()
    {
        abort_unless(LaboratorySetting::whereNotNull('laboratory_name')->exists(),422,'Informations du laboratoire incomplètes.');
        abort_unless(\App\Models\LaboratoryTest::where('is_active',true)->exists(),422,'Sélectionnez au moins une analyse.');
        ApplicationInstallation::whereKey(1)->update(['current_step'=>'completed','completed_at'=>now()]);
        return response()->json(['redirect'=>'/dashboard']);
    }
}
