<?php

namespace Database\Seeders;

use App\Models\{CollectionTube,MedicalCategory,MedicalTest,SpecimenType,TestParameter};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BiocentreCatalogSeeder extends Seeder
{
    private const SOURCE = 'Catalogue des examens et délais de rendu des résultats — Biocentre, PRA.FOR.022, version 04';

    public function run(): void
    {
        DB::transaction(function () {
            $cats = MedicalCategory::pluck('id', 'code');
            $serum = SpecimenType::where('code', 'SERUM')->value('id');
            $blood = SpecimenType::where('code', 'BLOOD')->value('id');
            $urine = SpecimenType::where('code', 'URINE')->value('id');
            $stool = SpecimenType::where('code', 'STOOL')->value('id');
            $swab = SpecimenType::where('code', 'SWAB')->value('id');
            $tubeSerum = CollectionTube::where('code', 'SERUM')->value('id');
            $tubeEdta = CollectionTube::where('code', 'EDTA')->value('id');
            $tubeUrine = CollectionTube::where('code', 'URINE')->value('id');

            $catalog = [
                'BIO' => ['ALB'=>'Albumine sanguine','AMY'=>'Amylase','BICARB'=>'Bicarbonate','CK'=>'Créatine kinase','GPP'=>'Glycémie postprandiale','OGTT'=>'HGPO / test d’O’Sullivan','LDH'=>'Lactate déshydrogénase','LIPASE'=>'Lipase','MG'=>'Magnésium','PHOS'=>'Phosphore','PROT'=>'Protéines totales','PCT'=>'Procalcitonine','EPP'=>'Électrophorèse des protéines','ELHB'=>'Électrophorèse de l’hémoglobine','ACE'=>'Enzyme de conversion de l’angiotensine','HAPTO'=>'Haptoglobine','INS'=>'Insulinémie','ADA'=>'Adénosine désaminase','GUTHRIE'=>'Test de Guthrie'],
                'URI' => ['IONU'=>'Ionogramme urinaire','UALB'=>'Albumine urinaire','UCA'=>'Calcium urinaire','UCREA'=>'Créatinine urinaire','UPHOS'=>'Phosphore urinaire','UMICRO'=>'Microalbuminurie','UURIC'=>'Acide urique urinaire','UMG'=>'Magnésium urinaire','UAMY'=>'Amylase urinaire'],
                'IMH' => ['ABORH'=>'Groupage sanguin ABO + Rhésus','DAT'=>'Test de Coombs direct','IAT'=>'Test de Coombs indirect / RAI'],
                'COA' => ['BTIME'=>'Temps de saignement'],
                'FER' => ['CTF'=>'Capacité totale de fixation du fer','TSAT'=>'Coefficient de saturation de la transferrine'],
                'CAR' => ['NT_PROBNP'=>'NT-proBNP','CKMB'=>'Créatine kinase MB'],
                'HOR' => ['CORT'=>'Cortisol','GH'=>'Hormone de croissance','FSH'=>'Hormone folliculo-stimulante','LH'=>'Hormone lutéinisante','ESTR'=>'Œstradiol','PTH'=>'Parathormone','PROG'=>'Progestérone','PRL'=>'Prolactine','TESTO'=>'Testostérone','BHCG_QUAL'=>'β-hCG qualitative','BHCG_QUANT'=>'β-hCG quantitative'],
                'TUM' => ['AFP'=>'Alpha-fœtoprotéine','PSA'=>'PSA total','FPSA'=>'PSA libre','BHCG_TUM'=>'β-hCG plasmatique, dimère et libre','CA125'=>'CA 125','CA153'=>'CA 15-3','CA199'=>'CA 19-9','CEA'=>'Antigène carcino-embryonnaire'],
                'AUT' => ['AGLIA'=>'Anti-gliadine IgA','AGLIG'=>'Anti-gliadine IgG','ATPO'=>'Anti-thyroperoxydase','AMA_M2'=>'Anti-mitochondries M2','ASMA'=>'Anti-muscle lisse','ALC1'=>'Anti-LC1','ALKM'=>'Anti-LKM','MYOSITIS'=>'Profil anticorps anti-myosites','AEMA'=>'Anti-endomysium IgA + IgG','ACARDM'=>'Anti-cardiolipine IgM','ACARDG'=>'Anti-cardiolipine IgG','B2GPM'=>'Anti-β2-glycoprotéine I IgM','B2GPG'=>'Anti-β2-glycoprotéine I IgG','MOG'=>'Anti-MOG','NMO'=>'Anti-AQP4 / NMO','TRAB'=>'Anticorps anti-récepteur de la TSH','ANA_IF'=>'Anticorps antinucléaires par IFI','ANA'=>'Anticorps antinucléaires','ASCA'=>'Anti-Saccharomyces cerevisiae IgA + IgG','MPO'=>'Anti-MPO','PR3'=>'Anti-PR3','CCP'=>'Anti-CCP','DSDNA'=>'Anti-ADN double brin','DFS70'=>'Anti-DFS70','RIBP'=>'Anti-protéine P ribosomale','HIST'=>'Anti-histones','NUCLEO'=>'Anti-nucléosomes','SSDNA'=>'Anti-ADN simple brin','PCNA'=>'Anti-PCNA','CENPB'=>'Anti-CENP B','PMSCL'=>'Anti-PM-Scl','SM'=>'Anti-Sm','JO1'=>'Anti-Jo-1','RNPSM'=>'Anti-RNP/Sm','SCL70'=>'Anti-Scl-70','SSA'=>'Anti-SSA/Ro','SSB'=>'Anti-SSB/La','ATG'=>'Anti-thyroglobuline','TTGA'=>'Anti-transglutaminase IgA','TTGG'=>'Anti-transglutaminase IgG','RF'=>'Facteur rhumatoïde'],
                'IMM' => ['IGA'=>'Immunoglobuline A','IGE'=>'Immunoglobuline E','IGG'=>'Immunoglobuline G','IGM'=>'Immunoglobuline M','C3'=>'Complément C3','C4'=>'Complément C4','TG_US'=>'Thyroglobuline ultrasensible','CALPRO'=>'Calprotectine fécale','SARS_AG'=>'Antigène SARS-CoV-2','IGE_FOOD'=>'IgE spécifiques — trophallergènes','IGE_RESP'=>'IgE spécifiques — pneumallergènes','HP_BREATH'=>'Helicobacter pylori — test respiratoire'],
                'SER' => ['MNI'=>'Test de mononucléose infectieuse','COVID_IGM'=>'SARS-CoV-2 IgM','COVID_IGG'=>'SARS-CoV-2 IgG','WIDAL'=>'Widal et Félix','HYDATID'=>'Sérologie hydatidose','CHLAM_IGM'=>'Chlamydia trachomatis IgM','CHLAM_IGG'=>'Chlamydia trachomatis IgG','EBNA_IGG'=>'EBV EBNA IgG','EBNA_IGM'=>'EBV EBNA IgM','EBV_VCA_IGG'=>'EBV VCA IgG','EBV_VCA_IGM'=>'EBV VCA IgM','HSV_IGG'=>'HSV 1/2 IgG','HSV_IGM'=>'HSV 1/2 IgM','HBC_IGG'=>'Anti-HBc IgG','HBC_IGM'=>'Anti-HBc IgM','HBEAG'=>'Antigène HBe','HBSAB'=>'Anticorps anti-HBs','HAV_IGM'=>'Hépatite A IgM','HAV_IGG'=>'Hépatite A IgG','HP_IGG'=>'Helicobacter pylori IgG','RUB_IGG'=>'Rubéole IgG','RUB_IGM'=>'Rubéole IgM','TOXO_IGG'=>'Toxoplasma gondii IgG','TOXO_IGM'=>'Toxoplasma gondii IgM','CMV_IGM'=>'Cytomégalovirus IgM','CMV_IGG'=>'Cytomégalovirus IgG','TPHA'=>'TPHA','VDRL'=>'VDRL'],
                'MIC' => ['ECBU'=>'Examen cytobactériologique des urines','BACT'=>'Examen cytobactériologique de prélèvement','CSF_CULT'=>'Examen cytobactériologique du LCR','BK'=>'Recherche de bacilles de Koch','BK_CULT'=>'Culture BK','BLOOD_CULT'=>'Hémoculture','STOOL_CULT'=>'Coproculture','SPERM_CULT'=>'Spermoculture','MYCO_URO'=>'Recherche des mycoplasmes urogénitaux','ROTA'=>'Recherche de rotavirus dans les selles','SCOTCH'=>'Scotch-test','QUANTIF'=>'Test QuantiFERON-TB','MALARIA_AG'=>'Antigènes solubles du Plasmodium','MALARIA_GE'=>'Plasmodium — goutte épaisse','HP_STOOL'=>'Antigène Helicobacter pylori dans les selles','FOBT'=>'Recherche de sang dans les selles'],
                'PAR' => ['STOOL_PARASITE'=>'Examen parasitologique des selles'],
                'MOL' => ['BK_PCR'=>'Mycobacterium tuberculosis par PCR','CHLAM_PCR'=>'Chlamydia trachomatis par PCR','HPV_PCR'=>'HPV par PCR temps réel','HBV_VL'=>'Charge virale VHB par PCR','HCV_VL'=>'Charge virale VHC par PCR','STI_PANEL'=>'Panel des infections sexuellement transmissibles par PCR','HP_PCR'=>'Helicobacter pylori par PCR et résistance à la clarithromycine'],
                'SPE' => ['SPERMOGRAM'=>'Spermogramme'],
            ];

            $catalog['SER']['ASLO'] = 'Antistreptolysine O';
            foreach ($catalog as $categoryCode => $tests) {
                foreach ($tests as $code => $name) {
                    [$specimen, $tube] = in_array($categoryCode, ['URI'], true) ? [$urine, $tubeUrine] : (in_array($code, ['CALPRO','HP_STOOL','FOBT','STOOL_CULT','ROTA','STOOL_PARASITE'], true) ? [$stool, null] : (in_array($categoryCode, ['MIC','MOL','PAR'], true) ? [$swab, null] : [$serum, $tubeSerum]));
                    if (in_array($categoryCode, ['HEM','IMH','COA'], true)) [$specimen, $tube] = [$blood, $tubeEdta];
                    $test = MedicalTest::updateOrCreate(['code' => $code], [
                        'medical_category_id' => $cats[$categoryCode], 'name' => $name,
                        'specimen_type_id' => $specimen, 'collection_tube_id' => $tube,
                        'source_type' => 'pdf', 'source_reference' => self::SOURCE,
                    ]);
                    TestParameter::updateOrCreate(['medical_test_id' => $test->id, 'code' => $code], ['name' => $name, 'result_type' => 'numeric']);
                }
            }
            MedicalTest::whereIn('code', [
                'URIC','ALT','AST','BILI','CA','CL','CHOL','HDL','LDL','CREA','CRP','GLU','HBA1C','NA','K','ALP','TG','UREA',
                'NFS','VS','RET','PT','APTT','FIB','DDIMER','FERR','IRON','TROP','BNP','FOL','B12','VITD','TSH','FT4','FT3','BHCG',
                'HIV','HBSAG','HCV','UACR','PROTU',
            ])->update(['source_type'=>'pdf','source_reference'=>self::SOURCE]);
        });
    }
}
