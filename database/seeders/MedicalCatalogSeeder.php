<?php

namespace Database\Seeders;

use App\Models\AnalysisGroup;
use App\Models\CatalogVersion;
use App\Models\CollectionTube;
use App\Models\MedicalCategory;
use App\Models\MedicalTest;
use App\Models\SpecimenType;
use App\Models\TestParameter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MedicalCatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $version = CatalogVersion::updateOrCreate(['version' => 'MA-2026.1'], ['source' => 'Catalogue de référence Tahlila', 'notes' => 'Les intervalles doivent être validés localement par le biologiste.', 'published_at' => now()]);
            $categories = [
                'HEM'=>'Hématologie','BIO'=>'Biochimie','URI'=>'Biochimie urinaire','COA'=>'Hémostase et coagulation','IMH'=>'Immuno-hématologie','IMM'=>'Immunologie','SER'=>'Sérologie','MIC'=>'Microbiologie','PAR'=>'Parasitologie','HOR'=>'Hormonologie','FER'=>'Bilan martial','TUM'=>'Marqueurs tumoraux','CAR'=>'Marqueurs cardiaques','VIT'=>'Vitaminologie','AUT'=>'Auto-immunité','TOX'=>'Toxicologie','MOL'=>'Biologie moléculaire','SPE'=>'Autres analyses spécialisées',
            ];
            $colors = ['#ef4444','#2563eb','#06b6d4','#7c3aed','#dc2626','#0f766e','#0891b2','#059669','#65a30d','#9333ea','#d97706','#be123c','#e11d48','#ca8a04','#4f46e5','#64748b','#0284c7','#475569'];
            foreach ($categories as $i => $name) $cat[$i] = MedicalCategory::updateOrCreate(['catalog_version_id'=>$version->id,'code'=>$i], ['name'=>$name,'icon'=>'flask-conical','color'=>$colors[array_search($i,array_keys($categories))],'sort_order'=>array_search($i,array_keys($categories))]);
            $specimens = ['BLOOD'=>'Sang total','SERUM'=>'Sérum','PLASMA'=>'Plasma','URINE'=>'Urines','STOOL'=>'Selles','SWAB'=>'Écouvillon','CSF'=>'Liquide céphalo-rachidien'];
            foreach ($specimens as $code=>$name) $spec[$code]=SpecimenType::updateOrCreate(['code'=>$code],['name'=>$name]);
            $tubes = ['EDTA'=>['Tube EDTA','Violet','K2/K3 EDTA'],'SERUM'=>['Tube sec avec gel','Jaune','Activateur de coagulation + gel'],'CITRATE'=>['Tube citrate','Bleu','Citrate de sodium'],'FLUORIDE'=>['Tube fluorure','Gris','Fluorure/oxalate'],'URINE'=>['Flacon urines','Transparent',null]];
            foreach ($tubes as $code=>$row) $tube[$code]=CollectionTube::updateOrCreate(['code'=>$code],['name'=>$row[0],'color'=>$row[1],'additive'=>$row[2]]);
            $groups = [
                ['HEM','NFS','Numération formule sanguine'],['HEM','RET','Réticulocytes'],['BIO','LIPID','Bilan lipidique'],['BIO','RENAL','Bilan rénal'],['BIO','LIVER','Bilan hépatique'],['BIO','IONO','Ionogramme sanguin'],['BIO','DIAB','Bilan diabétique'],['URI','URINE','Bilan urinaire'],['COA','COAG','Bilan de coagulation'],['HOR','THYR','Bilan thyroïdien'],['HOR','HORM','Bilan hormonal'],['FER','IRON','Bilan martial'],['CAR','CARDIAC','Marqueurs cardiaques'],['VIT','VITAMINS','Bilan vitaminique'],['SER','SERO','Sérologies courantes'],
            ];
            foreach ($groups as [$c,$code,$name]) $grp[$code]=AnalysisGroup::updateOrCreate(['medical_category_id'=>$cat[$c]->id,'code'=>$code],['name'=>$name]);
            $tests = [
                ['HEM','NFS','Numération formule sanguine','NFS','BLOOD','EDTA'],['HEM','VS','Vitesse de sédimentation','VS','BLOOD','EDTA'],['HEM','RET','Réticulocytes','RET','BLOOD','EDTA'],
                ['BIO','GLU','Glycémie','GLU','PLASMA','FLUORIDE'],['BIO','HBA1C','Hémoglobine glyquée','HbA1c','BLOOD','EDTA'],['BIO','UREA','Urée','UREE','SERUM','SERUM'],['BIO','CREA','Créatinine','CREA','SERUM','SERUM'],['BIO','URIC','Acide urique','AU','SERUM','SERUM'],
                ['BIO','CHOL','Cholestérol total','CT','SERUM','SERUM'],['BIO','HDL','Cholestérol HDL','HDL','SERUM','SERUM'],['BIO','LDL','Cholestérol LDL','LDL','SERUM','SERUM'],['BIO','TG','Triglycérides','TG','SERUM','SERUM'],
                ['BIO','ALT','Alanine aminotransférase','ALAT','SERUM','SERUM'],['BIO','AST','Aspartate aminotransférase','ASAT','SERUM','SERUM'],['BIO','GGT','Gamma-glutamyl transférase','GGT','SERUM','SERUM'],['BIO','ALP','Phosphatases alcalines','PAL','SERUM','SERUM'],['BIO','BILI','Bilirubine totale et directe','BILI','SERUM','SERUM'],
                ['BIO','NA','Sodium','Na','SERUM','SERUM'],['BIO','K','Potassium','K','SERUM','SERUM'],['BIO','CL','Chlorures','Cl','SERUM','SERUM'],['BIO','CA','Calcium','Ca','SERUM','SERUM'],['BIO','CRP','Protéine C-réactive','CRP','SERUM','SERUM'],
                ['COA','PT','Temps de prothrombine / INR','TP/INR','PLASMA','CITRATE'],['COA','APTT','Temps de céphaline activée','TCA','PLASMA','CITRATE'],['COA','FIB','Fibrinogène','FIB','PLASMA','CITRATE'],['COA','DDIMER','D-dimères','D-DIM','PLASMA','CITRATE'],
                ['HOR','TSH','Thyréostimuline','TSH','SERUM','SERUM'],['HOR','FT4','Thyroxine libre','FT4','SERUM','SERUM'],['HOR','FT3','Triiodothyronine libre','FT3','SERUM','SERUM'],['HOR','BHCG','β-hCG','β-hCG','SERUM','SERUM'],
                ['FER','FERR','Ferritine','FERR','SERUM','SERUM'],['FER','IRON','Fer sérique','Fe','SERUM','SERUM'],['FER','TRANS','Transferrine','TRF','SERUM','SERUM'],
                ['CAR','TROP','Troponine cardiaque','TROP','SERUM','SERUM'],['CAR','BNP','Peptide natriurétique de type B','BNP','PLASMA','EDTA'],
                ['VIT','VITD','25-OH vitamine D','25-OH-D','SERUM','SERUM'],['VIT','B12','Vitamine B12','B12','SERUM','SERUM'],['VIT','FOL','Folates','B9','SERUM','SERUM'],
                ['URI','UACR','Rapport albumine/créatinine urinaire','RAC','URINE','URINE'],['URI','PROTU','Protéinurie','PROTU','URINE','URINE'],
                ['SER','HIV','Sérologie VIH 1/2','VIH','SERUM','SERUM'],['SER','HBSAG','Antigène HBs','Ag HBs','SERUM','SERUM'],['SER','HCV','Anticorps anti-VHC','Ac VHC','SERUM','SERUM'],
            ];
            foreach ($tests as [$c,$code,$name,$abbr,$sp,$tb]) {
                $test[$code]=MedicalTest::updateOrCreate(['code'=>$code],['medical_category_id'=>$cat[$c]->id,'name'=>$name,'abbreviation'=>$abbr,'specimen_type_id'=>$spec[$sp]->id,'collection_tube_id'=>$tube[$tb]->id,'source_type'=>'common','source_reference'=>'Catalogue courant Tahlila — validation locale requise']);
                TestParameter::updateOrCreate(['medical_test_id'=>$test[$code]->id,'code'=>$code],['name'=>$name,'abbreviation'=>$abbr,'sort_order'=>0]);
            }
            $nfs = ['WBC'=>'Leucocytes','RBC'=>'Hématies','HGB'=>'Hémoglobine','HCT'=>'Hématocrite','MCV'=>'VGM','MCH'=>'TCMH','MCHC'=>'CCMH','PLT'=>'Plaquettes','NEUT_PCT'=>'Neutrophiles (%)','NEUT_ABS'=>'Neutrophiles (valeur absolue)','LYMPH_PCT'=>'Lymphocytes (%)','LYMPH_ABS'=>'Lymphocytes (valeur absolue)','MONO_PCT'=>'Monocytes (%)','MONO_ABS'=>'Monocytes (valeur absolue)','EOS_PCT'=>'Éosinophiles (%)','EOS_ABS'=>'Éosinophiles (valeur absolue)','BASO_PCT'=>'Basophiles (%)','BASO_ABS'=>'Basophiles (valeur absolue)','RDW_CV'=>'RDW-CV','RDW_SD'=>'RDW-SD','MPV'=>'VPM'];
            TestParameter::where('medical_test_id',$test['NFS']->id)->where('code','NFS')->delete();
            foreach ($nfs as $i=>$name) TestParameter::updateOrCreate(['medical_test_id'=>$test['NFS']->id,'code'=>$i],['name'=>$name,'abbreviation'=>$i,'sort_order'=>array_search($i,array_keys($nfs))]);
            $membership = ['NFS'=>['NFS'],'RET'=>['RET'],'LIPID'=>['CHOL','HDL','LDL','TG'],'RENAL'=>['UREA','CREA','URIC'],'LIVER'=>['ALT','AST','GGT','ALP','BILI'],'IONO'=>['NA','K','CL','CA'],'DIAB'=>['GLU','HBA1C'],'URINE'=>['UACR','PROTU'],'COAG'=>['PT','APTT','FIB','DDIMER'],'THYR'=>['TSH','FT4','FT3'],'HORM'=>['BHCG'],'IRON'=>['FERR','IRON','TRANS'],'CARDIAC'=>['TROP','BNP'],'VITAMINS'=>['VITD','B12','FOL'],'SERO'=>['HIV','HBSAG','HCV']];
            foreach ($membership as $g=>$codes) foreach ($codes as $i=>$code) $grp[$g]->tests()->syncWithoutDetaching([$test[$code]->id=>['sort_order'=>$i]]);
        });
        $this->call([BiocentreCatalogSeeder::class, DefaultReferenceRangeSeeder::class]);
    }
}
