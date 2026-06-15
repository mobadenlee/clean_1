export const CATEGORIES = [
  'Call-up & Mobilization',
  'PPA Issues',
  'Clearance',
  'CDS',
  'Posting',
  'Payment/Allowance',
  'Biometrics',
  'Documentation',
  'LGA Process',
  'SAED',
  'Accommodation',
  'General Admin',
  'Camp Issues',
];

export const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa',
  'Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti',
  'Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
  'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo',
  'Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

export const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export const URGENCY_CLASS_MAP = {
  Low:      'badge-teal urgency-low',
  Medium:   'badge-blue urgency-medium',
  High:     'badge-amber urgency-high',
  Critical: 'badge-red urgency-critical',
};

export const CATEGORY_BADGE_MAP = {
  'PPA Issues':        'badge-red',
  'Payment/Allowance': 'badge-amber',
  'Clearance':         'badge-purple',
  'CDS':               'badge-teal',
  'Biometrics':        'badge-blue',
  'Posting':           'badge-amber',
  'Accommodation':     'badge-purple',
};

export const AMBASSADOR_TRUST_THRESHOLD = 500;

export const BATCHES = [
  '2026C-II', '2026C-I', '2026B-II', '2026B-I', '2026A-II', '2026A-I',
  '2025C-II', '2025C-I', '2025B-II', '2025B-I', '2025A-II', '2025A-I',
  '2024C-II', '2024C-I', '2024B-II', '2024B-I', '2024A-II', '2024A-I',
  '2023C-II', '2023C-I', '2023B-II', '2023B-I', '2023A-II', '2023A-I',
  '2022C-II', '2022C-I', '2022B-II', '2022B-I', '2022A-II', '2022A-I',
];

export const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',        icon: 'home',     section: 'main' },
  { id: 'feed',          label: 'Issue Feed',        icon: 'issues',   section: 'main' },
  { id: 'search',        label: 'Search Issues',     icon: 'search',   section: 'main' },
  { id: 'post-issue',    label: 'Post an Issue',     icon: 'plus',     section: 'main' },
  { id: 'my-issues',     label: 'My Issues',         icon: 'tag',      section: 'account' },
  { id: 'saved',         label: 'Saved Issues',      icon: 'bookmark', section: 'account' },
  { id: 'notifications', label: 'Notifications',     icon: 'bell',     section: 'account', badge: 3 },
  { id: 'profile',       label: 'My Profile',        icon: 'user',     section: 'account' },
  { id: 'ambassador',    label: 'Ambassador Panel',  icon: 'shield',   section: 'ambassador' },
];

export const PAGE_TITLES = {
  dashboard:     'Dashboard',
  feed:          'Issue Feed',
  search:        'Search',
  'post-issue':  'Post Issue',
  'my-issues':   'My Issues',
  saved:         'Saved Issues',
  notifications: 'Notifications',
  profile:       'Profile',
  ambassador:    'Ambassador Panel',
  'issue-detail':'Issue Detail',
};
