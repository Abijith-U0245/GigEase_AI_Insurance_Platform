// Mock Data for GigEase – Food Delivery Worker Insurance Platform

export const USER_PROFILE = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  city: 'Mumbai',
  platform: 'Swiggy',
  joinedDate: '2025-11-15',
  profileImage: null,
};

export const WEEKLY_EARNINGS = {
  currentWeek: 8450,
  previousWeek: 7200,
  averageWeekly: 7800,
  targetWeekly: 9000,
  totalDeliveries: 142,
  hoursWorked: 48,
  currency: '₹',
};

export const EARNINGS_HISTORY = [
  { week: 'W1', earnings: 6800, deliveries: 98 },
  { week: 'W2', earnings: 7200, deliveries: 110 },
  { week: 'W3', earnings: 8100, deliveries: 130 },
  { week: 'W4', earnings: 7400, deliveries: 115 },
  { week: 'W5', earnings: 7900, deliveries: 125 },
  { week: 'W6', earnings: 8450, deliveries: 142 },
];

export const ACTIVE_POLICY = {
  id: 'POL-2026-0312',
  status: 'Active',
  weeklyPremium: 149,
  coverageLimit: 5000,
  coveredEvents: [
    'Heavy Rain',
    'Extreme Heat',
    'Air Pollution (AQI > 300)',
    'Traffic Shutdown',
    'Local Restrictions',
  ],
  autoDeduction: true,
  startDate: '2026-03-01',
  renewalDate: '2026-04-01',
  protectedIncome: 5000,
};

export const RISK_LEVEL = {
  current: 'Medium',         // 'Low' | 'Medium' | 'High'
  factors: [
    { label: 'Weather', level: 'High', detail: 'Heavy rain expected tonight' },
    { label: 'Air Quality', level: 'Low', detail: 'AQI 85 – Moderate' },
    { label: 'Traffic', level: 'Medium', detail: 'Rally near Dadar area' },
  ],
};

export const DISRUPTION_ALERTS = [
  {
    id: 'ALR-001',
    type: 'Weather',
    title: 'Heavy Rain Alert',
    description: 'Heavy rainfall expected in Mumbai from 8 PM. Deliveries may be impacted in Western suburbs.',
    severity: 'High',
    time: '2 hours ago',
    icon: 'cloud-rain',
  },
  {
    id: 'ALR-002',
    type: 'Traffic',
    title: 'Road Closure – Dadar',
    description: 'Political rally causing road closure near Dadar. Expect 30-40 min delays.',
    severity: 'Medium',
    time: '45 min ago',
    icon: 'alert-triangle',
  },
  {
    id: 'ALR-003',
    type: 'Heat',
    title: 'Extreme Heat Advisory',
    description: 'Temperature expected to reach 42°C tomorrow. Stay hydrated.',
    severity: 'Medium',
    time: '5 hours ago',
    icon: 'thermometer',
  },
];

export const CLAIMS = [
  {
    id: 'CLM-2026-001',
    event: 'Heavy Rainfall – Mar 10',
    type: 'Weather',
    estimatedLoss: 1200,
    payoutAmount: 1100,
    status: 'Approved',
    date: '2026-03-10',
    icon: 'cloud-rain',
  },
  {
    id: 'CLM-2026-002',
    event: 'Traffic Shutdown – Mar 14',
    type: 'Traffic',
    estimatedLoss: 800,
    payoutAmount: null,
    status: 'Pending',
    date: '2026-03-14',
    icon: 'alert-triangle',
  },
  {
    id: 'CLM-2026-003',
    event: 'Extreme Heat – Feb 28',
    type: 'Heat',
    estimatedLoss: 900,
    payoutAmount: 0,
    status: 'Rejected',
    date: '2026-02-28',
    icon: 'thermometer',
  },
];

export const NOTIFICATIONS = [
  {
    id: 'NOT-001',
    title: 'Heavy Rain Alert – Mumbai',
    body: 'Heavy rain expected tonight. Your earnings are protected under your active policy.',
    type: 'weather',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'NOT-002',
    title: 'Claim Approved – ₹1,100',
    body: 'Your claim for Heavy Rainfall on Mar 10 has been approved. Payout will be credited within 24h.',
    type: 'claim',
    time: '1 day ago',
    read: false,
  },
  {
    id: 'NOT-003',
    title: 'Weekly Premium Deducted',
    body: '₹149 has been auto-deducted from your weekly earnings for policy renewal.',
    type: 'policy',
    time: '3 days ago',
    read: true,
  },
  {
    id: 'NOT-004',
    title: 'Policy Renewal Reminder',
    body: 'Your policy renews on Apr 1. Ensure sufficient earnings balance for auto-deduction.',
    type: 'policy',
    time: '5 days ago',
    read: true,
  },
  {
    id: 'NOT-005',
    title: 'Air Quality Warning',
    body: 'AQI may exceed 300 tomorrow. If deliveries are affected, a claim will be auto-generated.',
    type: 'weather',
    time: '6 days ago',
    read: true,
  },
];

export const DELIVERY_TRENDS = {
  peakHours: '12 PM – 2 PM, 7 PM – 10 PM',
  busiestDay: 'Sunday',
  avgDeliveriesPerDay: 20,
  avgEarningsPerDelivery: 59,
};

export const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Jaipur'];

export const PLATFORMS = ['Swiggy', 'Zomato'];
