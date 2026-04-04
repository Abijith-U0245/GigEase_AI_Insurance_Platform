import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';

const ClaimAppeal: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/claims')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Claim Appeal</h1>
      </div>
      <div className="bg-danger/5 border border-danger rounded-card p-4 mb-4">
        <p className="text-sm font-bold text-danger mb-1">Claim Rejected</p>
        <p className="text-sm text-textSecondary">Automated fraud detection triggered — GPS location anomaly detected.</p>
      </div>
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-xs text-textSecondary">Appeal Deadline</p>
        <p className="text-xl font-bold text-danger">30 days remaining</p>
      </div>
      <div className="border-2 border-dashed border-borderColor rounded-card p-8 flex flex-col items-center text-center mb-4">
        <Upload size={32} className="text-textSecondary mb-2" />
        <p className="text-sm font-semibold text-textPrimary">Upload Supporting Documents</p>
        <p className="text-xs text-textSecondary mt-1">Drag & drop or tap to select</p>
      </div>
      <button className="w-full bg-accent text-white font-bold py-4 rounded-btn shadow-button">File Appeal</button>
    </div>
  );
};

export default ClaimAppeal;
