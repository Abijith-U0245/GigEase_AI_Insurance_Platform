import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Plain-language titles for gig workers (no internal codes in headings). */
const events = [
  {
    title: 'Identity verified',
    tag: 'Onboarding',
    color: '#34d399',
    date: '15 Jan 2024',
    detail:
      'Your Aadhaar was confirmed through DigiLocker. This unlocks payouts to your verified name and UPI only.',
  },
  {
    title: 'Policy started',
    tag: 'Coverage',
    color: '#60a5fa',
    date: '15 Jan 2024',
    detail: 'Policy GE-2024-VEL-001 is now active. STFI and RSMD covers apply based on zone and government confirmations.',
  },
  {
    title: 'Premium adjusted for season',
    tag: 'Premium',
    color: '#fbbf24',
    date: '7 Oct 2024',
    detail:
      'Rainy months use a 0.65× seasonal factor on top of your base rate. You pay a bit less in low-risk weeks and more when flood risk is higher.',
  },
  {
    title: 'Claim loading applied',
    tag: 'After claim',
    color: '#f87171',
    date: '4 Nov 2024',
    detail:
      'After your STFI payout, a 5% loading was added to the next premium cycles. It helps the shared pool recover; it is not a penalty fee.',
  },
  {
    title: 'Payout sent',
    tag: 'Money',
    color: '#34d399',
    date: '4 Nov 2024',
    detail: '₹1,243.50 was credited to your linked UPI after automated checks passed.',
  },
];

const PolicyEventLog: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/policy')}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/25 bg-black/40 text-orange-400 hover:bg-orange-500/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-sans text-2xl font-black text-white md:text-3xl">Policy activity</h1>
          <p className="mt-1 text-sm font-semibold text-neutral-400">What changed on your cover and why</p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-amber-500/30 to-transparent" />
        <div className="space-y-5 pl-12">
          {events.map((e, i) => (
            <div key={i} className="relative">
              <div
                className="absolute -left-[30px] top-3 h-3.5 w-3.5 rounded-full border-2 border-black shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: e.color, color: e.color }}
              />
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#141414] to-black p-4 shadow-lg backdrop-blur-md md:p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide"
                    style={{ backgroundColor: `${e.color}22`, color: e.color }}
                  >
                    {e.tag}
                  </span>
                  <span className="text-xs font-bold text-neutral-500">{e.date}</span>
                </div>
                <p className="text-lg font-black text-white">{e.title}</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-300 md:text-base">{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyEventLog;
