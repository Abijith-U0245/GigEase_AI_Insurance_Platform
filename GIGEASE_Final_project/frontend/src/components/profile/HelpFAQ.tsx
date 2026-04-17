import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  { q: 'How does payout work?', a: 'When your weekly income drops below 60% of your 12-week average AND a certified disruption event (STFI/RSMD) is confirmed in your zone, GigEase automatically calculates and transfers a payout to your UPI account within minutes.' },
  { q: 'Why was my claim rejected?', a: 'Claims may be rejected if our fraud detection system finds GPS anomalies, device inconsistencies, or if the income drop cannot be corroborated by platform data. You can file an appeal within 30 days.' },
  { q: 'What is claim loading on premium?', a: 'After a claim is paid, a small percentage may be added to your next premiums so the shared pool stays healthy. It is temporary and shown clearly in your policy activity log.' },
  { q: 'What is STFI and RSMD?', a: 'STFI stands for Storm, Tempest, Flood, and Inundation — natural disaster events. RSMD stands for Riots, Strikes, Military action, and Disturbances — civil disruption events. Both trigger automatic payouts when confirmed by government sources.' },
  { q: 'When is premium deducted?', a: 'Your premium of ₹170 is deducted every Monday from your registered payment method. Premiums are recalculated every Sunday at 11 PM based on your current risk profile.' },
  { q: 'How do I update my UPI ID?', a: 'Go to Profile > Edit Profile > Update your UPI ID. Changes take effect from the next premium cycle. Ensure your UPI ID is active before updating.' },
];

const HelpFAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/profile')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Help & FAQs</h1>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs..." className="w-full pl-9 pr-4 py-3 border border-borderColor rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div className="space-y-2 mb-5">
        {filtered.map((faq, i) => (
          <motion.div key={i} layout className="bg-white rounded-card shadow-card overflow-hidden">
            <button className="w-full p-4 flex justify-between items-center text-left" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <span className="text-sm font-semibold text-textPrimary pr-3">{faq.q}</span>
              <motion.div animate={{ rotate: openIdx === i ? 90 : 0 }} className="flex-shrink-0"><ChevronDown size={16} className="text-textSecondary" /></motion.div>
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-textSecondary">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <div className="bg-white rounded-card shadow-card p-4">
        <p className="text-sm font-bold text-textPrimary mb-3">Contact Support</p>
        <button className="w-full bg-[#25D366] text-white font-bold py-3 rounded-btn mb-2">💬 WhatsApp Support</button>
        <button className="w-full border border-primary text-primary font-bold py-3 rounded-btn">📞 Call Support</button>
      </div>
    </div>
  );
};

export default HelpFAQ;
