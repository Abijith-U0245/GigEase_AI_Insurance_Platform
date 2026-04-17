import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle2, ShieldCheck, X, Building2, ChevronRight, User } from 'lucide-react';
import WhatsAppOTP from './WhatsAppOTP';

interface Props {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
}

export default function RazorpayMock({ amount, onSuccess, onClose, title = "GigEase Verification" }: Props) {
  const [step, setStep] = useState<'CONTACT' | 'OTP' | 'SUCCESS'>('CONTACT');
  const [phone, setPhone] = useState('9999999989');
  
  if (step === 'OTP') {
    return (
      <WhatsAppOTP 
        phone={phone}
        purpose="CLAIM_VERIFY"
        onVerified={() => setStep('SUCCESS')}
        onCancel={() => setStep('CONTACT')}
      />
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 shadow-2xl flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-[#2a2a2a] text-center mb-2">Payment Successful</h3>
          <p className="text-[#646464] text-sm text-center mb-6">Redirecting to dashboard...</p>
          <button onClick={onSuccess} className="w-full bg-[#1b61c9] text-white py-3 rounded-md font-semibold text-sm hover:bg-[#13499b]">
            Proceed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 shadow-2xl flex items-center justify-center p-4 sm:p-0">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[380px] overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#2956f6] text-white pt-5 pb-4 px-5 relative h-36 border-none">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/90 hover:text-white">
            <X size={18} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 border border-white/40 rounded flex items-center justify-center font-bold text-xl drop-shadow">
              A
            </div>
            <div className="flex-1 mt-0.5">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
              <div className="flex items-center gap-1 mt-1 text-[11px] bg-white/10 w-fit px-1.5 py-0.5 rounded border border-white/20">
                <ShieldCheck size={12} className="text-green-300" />
                <span className="text-white">Razorpay Trusted Business</span>
              </div>
            </div>
          </div>
          
          <div className="absolute left-5 right-5 bottom-4 flex justify-between items-end border-t border-white/20 pt-3">
            <div className="text-xs font-medium text-white/90">Total Amount</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              <span className="opacity-90">₹</span> {amount}
            </div>
          </div>
        </div>

        <div className="bg-[#eff3f6] text-center py-2 text-[10px] text-slate-500 font-medium flex justify-center items-center gap-1 border-b border-slate-200">
          🔒 Secured by <strong className="text-slate-700 italic flex items-center"><span className="text-blue-600 font-black mr-0.5 text-xs">/</span>Razorpay</strong>
        </div>

        {/* Body */}
        <div className="p-4 bg-white min-h-[350px]">
          {/* Contact Details */}
          <div className="mb-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] mb-3">
               <User size={16} className="text-slate-400" /> Contact Details
            </h4>
            <div className="border border-slate-200 rounded-md overflow-hidden flex bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <div className="bg-slate-50 px-3 py-3 border-r border-slate-200 text-sm text-[#1a1a1a] font-medium flex items-center">
                +91 
              </div>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-3 outline-none text-sm font-medium text-[#1a1a1a] tracking-wide placeholder-slate-300"
                placeholder="Phone Number"
                maxLength={10}
              />
            </div>
          </div>

          {/* Pay Using */}
          <div>
            <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2">Pay Using</h4>
            <div className="border border-slate-200 rounded-md bg-white overflow-hidden divide-y divide-slate-100">
              
              {/* Selected UPI Method */}
              <label className="flex items-start gap-4 p-4 cursor-pointer hover:bg-blue-50/50 transition">
                <div className="w-8 h-8 rounded border border-blue-100 bg-blue-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#1a1a1a]">UPI / QR</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm & more</div>
                </div>
                <div className="w-5 h-5 rounded-full border-[5px] border-blue-600 bg-white" />
              </label>

              {/* Other Method */}
              <label className="flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-50 transition opacity-60">
                <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                  <CreditCard size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-[#1a1a1a]">Debit/Credit Card</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Visa, Mastercard, RuPay & more</div>
                </div>
                <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
              </label>
              
              {/* Other Method */}
              <label className="flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-50 transition opacity-60">
                <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                  <Building2 size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-[#1a1a1a]">Netbanking</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">All Indian banks</div>
                </div>
                <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
              </label>

            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <button 
            onClick={() => { if(phone.length >= 10) setStep('OTP'); }} 
            className="w-full bg-[#2956f6] hover:bg-[#1f42cd] text-white py-3.5 rounded font-bold shadow-[0_4px_14px_rgba(41,86,246,0.25)] transition-all flex items-center justify-center gap-1 text-[15px]"
          >
            Pay using UPI / QR
          </button>
        </div>
      </div>
    </div>
  );
}
