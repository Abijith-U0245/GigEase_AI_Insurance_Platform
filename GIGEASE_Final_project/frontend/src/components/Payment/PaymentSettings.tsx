import React, { useState } from 'react';
import { Settings2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function PaymentSettings({ workerId = "W1234" }: { workerId?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workerId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/payment/settings/${workerId}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoPay = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:8000/api/payment/settings/${workerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autopay_enabled: checked,
          claiming_mode: checked ? "AUTOPAY" : "MANUAL"
        })
      });
      if (res.ok) {
        setData((prev: any) => ({ ...prev, autopay_enabled: checked, claiming_mode: checked ? "AUTOPAY" : "MANUAL" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="h-64 bg-white/5 animate-pulse rounded-xl" />;

  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
          <Settings2 size={20} className="text-[#FF5722]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Payment & Claim Settings</h2>
          <p className="text-zinc-500 text-sm">Manage how you pay premiums and receive claims</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle AutoPay */}
        <div className="flex items-start justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
              <Zap size={16} className={data?.autopay_enabled ? "text-yellow-400" : "text-zinc-500"} />
              AutoPay Claims (Recommended)
            </h3>
            <p className="text-zinc-400 text-sm max-w-[80%]">
              When enabled, approved claims are instantly credited to your linked UPI.
            </p>
          </div>
          <button
            onClick={() => toggleAutoPay(!data?.autopay_enabled)}
            disabled={isUpdating}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${data?.autopay_enabled ? 'bg-[#FF5722]' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${data?.autopay_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 bg-[#FF5722]/10 border border-[#FF5722]/20 rounded-xl">
          <AlertCircle className="text-[#FF5722] shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-[#FF5722]/90 leading-relaxed">
            GigEase highly recommends AutoPay. Without it, you must manually interact with WhatsApp during a storm to receive payouts.
          </p>
        </div>

        {/* Connection Status */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h4 className="text-white font-medium text-sm">Active Connections</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className={data?.upi_linked ? "text-green-500" : "text-zinc-600"} />
              <span className="text-zinc-300 text-sm">UPI Account Linked</span>
            </div>
            <span className="text-sm font-medium text-white">{data?.upi_linked ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className={data?.phone_verified_whatsapp ? "text-green-500" : "text-zinc-600"} />
              <span className="text-zinc-300 text-sm">WhatsApp Verified</span>
            </div>
            <span className="text-sm font-medium text-white">{data?.phone_verified_whatsapp ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
