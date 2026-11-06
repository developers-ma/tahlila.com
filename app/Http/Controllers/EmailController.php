<?php


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;


use App\Models\EmailSetting;
use App\Models\Patient;
use App\Mail\TestResultReady;

class EmailController extends Controller
{
   //auto send email
   public function sendTestResultEmail(Request $request)
   {
       $request->validate(['email' => 'required|email|max:255']);
       // Check if email notifications are enabled in the email_settings table
       $emailSetting = EmailSetting::first(); // Assuming you only have one row for settings
       if ($emailSetting && $emailSetting->email_notification === "true") {
   
           // Find the patient email by patient ID
           $patientEmail = $request->email;
   
           // Send the email
           try {
               // Assuming you have a TestResultReady mailable to send the email
               Mail::to($patientEmail)->send(new TestResultReady($patientEmail));
               return response()->json(['success' => true]);
           } catch (\Exception $e) {
               report($e);
               return response()->json(['success' => false, 'message' => 'Envoi impossible. Vérifiez la configuration SMTP.'], 502);
           }
       }
   
       return response()->json(['success' => false, 'message' => 'Email notifications are not enabled.']);
   }
   
    public function sendEmail(Request $request)
    {
        // Validate the incoming request
        $validated = Validator::make($request->all(), [
            'email' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        if ($validated->fails()) {
            return redirect()->back()->withErrors($validated)->withInput();
        }

        // Send the email
        try {
            Mail::raw($request->message, function ($message) use ($request) {
                $message->to($request->email)
                    ->subject($request->subject);
            });

            return redirect()->back()->with('success', __('Email sent successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to send email. Please try again.'));
        }
    }
}
