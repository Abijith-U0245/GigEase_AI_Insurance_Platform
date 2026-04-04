import React from 'react';

interface StepperProps { current: number; total: number; labels: string[]; }

const RegStepper: React.FC<StepperProps> = ({ current, total, labels }) => (
  <div className="flex items-center justify-between mb-8 px-2">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${i < current ? 'bg-success text-white' : i === current ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-[10px] font-medium ${i === current ? 'text-primary' : 'text-textSecondary'}`}>{labels[i]}</span>
        </div>
        {i < total - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < current ? 'bg-success' : 'bg-gray-200'}`} />}
      </React.Fragment>
    ))}
  </div>
);

export default RegStepper;
