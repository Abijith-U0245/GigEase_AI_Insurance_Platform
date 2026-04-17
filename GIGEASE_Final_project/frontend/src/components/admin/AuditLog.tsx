import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FRAUD_CHECKS = [
  'GPS location matches registered zone','Device fingerprint consistent','Login location matches GPS','Delivery count non-zero during event window',
  'Platform API income matches reported','No duplicate claim in same event','Claim frequency normal (<3 in 12 weeks)','Aadhaar verified',
  'UPI account age >30 days','Zone risk score matches actual zone','Rainfall data corroborates claim','Peer worker income drop pattern consistent',
  'Account not flagged in previous audits','Time of claim vs. event window overlap','App activity during disruption window','Network IP consistent with zone',
  'ML anomaly score below threshold'
];

const CLAIMS = [
  { id:'GE-CLM-001', worker:'W001 — Arun S', event:'STFI', payout:'₹1,243.50', fraudScore:0.12, status:'AUTO_APPROVED', date:'04-Nov-2024', w001:true },
  { id:'GE-CLM-002', worker:'W002 — Meena R', event:'STFI', payout:'₹0', fraudScore:0.05, status:'NO_CLAIM', date:'04-Nov-2024', w001:false },
  { id:'GE-CLM-003', worker:'W099 — Rajan K', event:'STFI', payout:'₹0', fraudScore:0.87, status:'AUTO_REJECTED', date:'04-Nov-2024', w001:false },
];

const AuditLog: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const passCheck = (idx: number, isW001: boolean) => {
    if (isW001) return idx !== 9; // W001 fails check 10 (index 9: zone risk mismatch)... but actually all pass
    // W099: fails 1,2,3,10,13,15,16,17 (indices 0,1,2,9,12,14,15,16)
    return ![0,1,2,9,12,14,15,16].includes(idx);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-textPrimary mb-6">Claims Audit Log</h1>
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-borderColor">
            <tr>{['Claim ID','Worker','Event','Payout','Fraud Score','Status','Date',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-textSecondary uppercase tracking-widest">{h}</th>)}</tr>
          </thead>
          <tbody>
            {CLAIMS.map(c => (
              <React.Fragment key={c.id}>
                <tr className="border-b border-borderColor hover:bg-background cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{c.id}</td>
                  <td className="px-4 py-3 font-medium">{c.worker}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-pill">{c.event}</span></td>
                  <td className="px-4 py-3 font-bold">{c.payout}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full" style={{width:`${c.fraudScore*100}%`, backgroundColor: c.fraudScore<0.3?'#22C55E':c.fraudScore<0.5?'#F59E0B':'#EF4444'}} /></div>
                      <span className="text-xs">{c.fraudScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-pill ${c.status==='AUTO_APPROVED'?'bg-success/10 text-success':c.status==='AUTO_REJECTED'?'bg-danger/10 text-danger':'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">{c.date}</td>
                  <td className="px-4 py-3 text-textSecondary text-xs">▼</td>
                </tr>
                <AnimatePresence>
                  {expanded === c.id && (
                    <motion.tr>
                      <td colSpan={8} className="px-4 py-3 bg-background">
                        <div className="grid grid-cols-3 gap-2">
                          {FRAUD_CHECKS.map((check, i) => {
                            const pass = passCheck(i, c.w001 || c.fraudScore < 0.3);
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className={pass ? 'text-success' : 'text-danger'}>{pass ? '✓' : '✗'}</span>
                                <span className={pass ? 'text-textPrimary' : 'text-danger'}>{check}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-borderColor text-xs text-textSecondary">
                          {c.w001 || c.fraudScore < 0.3 ? '16/17 checks passed' : '9/17 checks passed'} · Fraud Score: {c.fraudScore}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
