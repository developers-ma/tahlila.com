<?php

namespace Database\Seeders;

use App\Models\{ParameterReferenceRange,TestParameter};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DefaultReferenceRangeSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $adult = 18 * 365;
            $nih = 'NHLBI/NIH, Blood Tests — normal adult CBC ranges, updated 2022: https://www.nhlbi.nih.gov/health/blood-tests';
            $ranges = [
                ['WBC','all',4500,10000,'cellules/µL',$nih], ['PLT','all',140000,450000,'cellules/µL',$nih],
                ['RBC','male',5,6,'10^6/µL',$nih], ['RBC','female',4,5,'10^6/µL',$nih],
                ['HGB','male',14,17,'g/dL',$nih], ['HGB','female',12,15,'g/dL',$nih],
                ['HCT','male',41,50,'%',$nih], ['HCT','female',36,44,'%',$nih],
                ['NA','all',135,145,'mmol/L','NCBI Bookshelf, Appendix A — Normal Reference Ranges: https://www.ncbi.nlm.nih.gov/books/NBK613071/'],
                ['K','all',3.5,5,'mmol/L','NCBI Bookshelf, Appendix A — Normal Reference Ranges: https://www.ncbi.nlm.nih.gov/books/NBK613071/'],
                ['CA','all',8.5,10.2,'mg/dL','NCBI Bookshelf, Appendix A — Normal Reference Ranges: https://www.ncbi.nlm.nih.gov/books/NBK613071/'],
                ['GLU','all',65,110,'mg/dL','NCBI Bookshelf, Appendix A — Normal Reference Ranges: https://www.ncbi.nlm.nih.gov/books/NBK613071/'],
                ['FERR','male',31,409,'µg/L','Mayo Clinic Laboratories, Ferritin Serum (FERR1), ECLIA: https://mml.testcatalog.org/show/FERR1'],
                ['FERR','female',6,175,'µg/L','Mayo Clinic Laboratories, Ferritin Serum (FERR1), women 18–50, ECLIA: https://mml.testcatalog.org/show/FERR1'],
            ];
            foreach ($ranges as [$code,$sex,$low,$high,$unit,$source]) {
                $parameter = TestParameter::where('code', $code)->first();
                if (!$parameter) continue;
                ParameterReferenceRange::updateOrCreate([
                    'test_parameter_id'=>$parameter->id,'sex'=>$sex,'age_min_days'=>$adult,'age_max_days'=>null,
                    'method'=>$code === 'FERR' ? 'Électrochimiluminescence (ECLIA)' : null,'analyzer'=>null,
                ], ['lower_bound'=>$low,'upper_bound'=>$high,'unit'=>$unit,'validation_status'=>'to_verify','source_citation'=>$source,'validated_by'=>null,'validated_at'=>null]);
                $parameter->update(['unit'=>$unit]);
            }
        });
    }
}
