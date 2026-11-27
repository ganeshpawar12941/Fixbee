export const Colors = {
  // Pure Black & Yellow FixBee Theme
  primary: '#FFC107',         // Pure Bumblebee Yellow
  primaryDark: '#D99B00',
  primaryLight: '#FFD54F',
  primaryGlow: 'rgba(255, 193, 7, 0.18)',

  // Backgrounds & Surfaces (Clean Black)
  bgDark: '#0A0A0C',          // True Deep Black
  bgCard: '#121214',          // Solid Matte Dark Charcoal
  bgCardElevated: '#18181C',  // Elevated Card Slate
  bgInput: '#18181C',         // Clean Dark Input
  bgOverlay: 'rgba(10, 10, 12, 0.90)',

  // Borders & Accents (Yellow and Subtle Dark Borders)
  borderSubtle: '#222226',
  borderHighlight: '#FFC107',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  divider: '#1A1A1E',

  // Text Hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#0A0A0C',

  // Upvote Accents (All Yellow)
  upvoteActive: '#FFC107',
  upvoteInactive: '#71717A',
  upvoteBg: 'rgba(255, 193, 7, 0.12)',

  // Status Badges (Strictly Yellow Accents on Dark)
  statusSubmitted: '#FFC107',
  statusUnderReview: '#FFB800',
  statusInProgress: '#FFC107',
  statusResolved: '#22C55E', // Green for resolved confirmation
  statusRejected: '#EF4444', // Red for rejected

  // Accents
  accentDanger: '#EF4444',
  accentSuccess: '#22C55E',
};

export const LocationTypes = [
  { id: 'all', label: 'All Zones', icon: 'apps-outline' },
  { id: 'boys_hostel', label: "Boys' Hostel", icon: 'man' },
  { id: 'girls_hostel', label: "Girls' Hostel", icon: 'woman' },
  { id: 'campus', label: 'Campus Grounds', icon: 'business-outline' },
];

export const Categories = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { id: 'civil', label: 'Civil Works', icon: 'construct-outline' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'water_supply', label: 'Water Supply', icon: 'water' },
  { id: 'washroom', label: 'Washrooms', icon: 'business-outline' },
  { id: 'waste_management', label: 'Waste Mgmt', icon: 'trash-outline' },
  { id: 'garden_outdoor', label: 'Outdoor Grounds', icon: 'leaf-outline' },
  { id: 'safety', label: 'Campus Safety', icon: 'shield-checkmark-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export const SeverityLevels = [
  { id: 'low', label: 'Low', desc: 'Minor issue', color: '#A1A1AA' },
  { id: 'medium', label: 'Medium', desc: 'Needs attention', color: '#FFC107' },
  { id: 'high', label: 'High Urgency', desc: 'Needs prompt action', color: '#FFC107' },
];

export const StatusPills = {
  submitted: { label: 'Submitted', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.12)', icon: 'paper-plane-outline' },
  under_review: { label: 'Under Review', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.12)', icon: 'eye-outline' },
  in_progress: { label: 'In Progress', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.12)', icon: 'construct-outline' },
  resolved: { label: 'Resolved', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: 'close-circle-outline' },
};
