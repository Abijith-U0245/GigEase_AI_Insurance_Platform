import React, { useState } from 'react';
import { MessageCircle, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';

interface Props {
  phone: string;
  purpose: 'LOGIN' | 'NACH_MANDATE' | 'CLAIM_VERIFY';
  onVerified: (token: string) => void;
  onCancel?: () => void;
}

export default function WhatsAppOTP({ phone, purpose, onVerified, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1500);
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter full 6-digit OTP'); return; }
    setLoading(true);
    setTimeout(() => {
      if (code === '000000') { setError('Invalid code (Try 123456)'); setLoading(false); return; }
      setLoading(false);
      setStep(3);
      setTimeout(() => onVerified(`demo_session_${Date.now()}`), 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/5 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative p-8">

        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6">
              <MessageCircle size={32} className="text-[#25D366]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify WhatsApp</h2>
            <p className="text-zinc-400 text-sm mb-8 px-4">
              We use WhatsApp to securely verify your identity and send instant claim updates.
            </p>
            <div className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 mb-8">
              <Phone className="text-zinc-500" size={20} />
              <span className="text-white text-lg tracking-wide flex-1 text-left">+91 {phone}</span>
            </div>
            <div className="w-full flex gap-3">
              {onCancel && (
                <button onClick={onCancel} className="flex-1 border border-white/10 text-white rounded-xl py-3 text-sm font-semibold hover:bg-white/5">
                  Cancel
                </button>
              )}
              <button onClick={handleSendOTP} disabled={loading} className="flex-1 bg-[#25D366] hover:bg-[#1DA851] text-black font-semibold rounded-xl py-3 text-sm">
                {loading ? "Sending..." : "Send via WhatsApp"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center">
            <ShieldCheck size={40} className="text-[#FF5722] mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Enter verification code</h2>
            <p className="text-zinc-400 text-sm mb-8">
              Sent to <span className="text-white font-medium">+91 {phone}</span> on WhatsApp.
            </p>
            <div className="flex gap-2 mb-6">
              {otp.map((v, i) => (
                <input
                  key={i} type="text" maxLength={1} value={v}
                  onChange={(e) => {
                    const newOtp = [...otp]; newOtp[i] = e.target.value; setOtp(newOtp);
                    if (e.target.value && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                  }}
                  id={`otp-${i}`}
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-lg text-center text-xl text-white font-mono focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] outline-none transition-all"
                />
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button onClick={handleVerify} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-semibold mb-6 py-4 rounded-xl text-sm">
              {loading ? "Verifying..." : "Confirm OTP"}
            </button>
            <div className="flex justify-between w-full items-center text-sm text-zinc-500">
              <button className="hover:text-white transition">Resend code</button>
              <span>Demo (Use any 6 digits)</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse mb-6">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verified Successfully</h2>
            <p className="text-zinc-400 text-sm">Security check complete.</p>
          </div>
        )}
      </div>
    </div>
  );
}
