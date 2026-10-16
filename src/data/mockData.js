// Mock data for WorkRadar.
// Timestamps are generated relative to "now" so the demo always looks like today.
// In production these records would come from Slack, Jira, GitHub and Email connectors
// and be normalised into this single WorkItem shape.

const HOUR = 3600 * 1000;
const ago = (h) => new Date(Date.now() - h * HOUR).toISOString();
const inH = (h) => new Date(Date.now() + h * HOUR).toISOString();

export const ME = 'neha';

export const PEOPLE = {
  neha: { id: 'neha', name: 'Neha Sharma', role: 'Engineering Manager', initials: 'NS', color: '#4f46e5' },
  arjun: { id: 'arjun', name: 'Arjun Mehta', role: 'Backend Engineer', initials: 'AM', color: '#0891b2' },
  priya: { id: 'priya', name: 'Priya Nair', role: 'Frontend Engineer', initials: 'PN', color: '#db2777' },
  rahul: { id: 'rahul', name: 'Rahul Verma', role: 'QA Engineer', initials: 'RV', color: '#ca8a04' },
  sara: { id: 'sara', name: 'Sara Khan', role: 'DevOps Engineer', initials: 'SK', color: '#16a34a' },
  vikram: { id: 'vikram', name: 'Vikram Rao', role: 'Mobile Engineer', initials: 'VR', color: '#ea580c' },
  meera: { id: 'meera', name: 'Meera Iyer', role: 'Product Designer', initials: 'MI', color: '#9333ea' },
};

export const TEAM = ['arjun', 'priya', 'rahul', 'sara', 'vikram', 'meera'];

export const SOURCES = {
  slack: { id: 'slack', label: 'Slack', color: '#611f69' },
  jira: { id: 'jira', label: 'Jira', color: '#0052cc' },
  github: { id: 'github', label: 'GitHub', color: '#24292f' },
  email: { id: 'email', label: 'Email', color: '#d9480f' },
};

/**
 * WorkItem shape
 * id, source, kind, ref, title, body, author, assignee, channel,
 * createdAt, updatedAt, dueAt, severity (critical|high|medium|low),
 * status (open|done), snoozedUntil, blocked {person, waitingOn, since},
 * unblocks (person id), mentionsMe, reviewRequestedFromMe, labels[], thread[], related[], doneAt
 */
export function buildMockItems() {
  return [
    {
      id: 'jira-482', source: 'jira', kind: 'ticket', ref: 'PAY-482',
      title: 'UPI payment webhooks failing on retry for ~3% of transactions',
      body: 'Since last night\'s deploy, webhook retries for UPI transactions return 409 from the ledger service. Roughly 3% of UPI payments are stuck in "pending" and customers are seeing duplicate debit SMS. Needs a fix or rollback before the evening traffic peak.',
      author: 'rahul', assignee: 'arjun', channel: 'Payments Platform',
      createdAt: ago(6), updatedAt: ago(0.5), dueAt: inH(5), severity: 'critical', status: 'open',
      labels: ['incident', 'customer-impact'], mentionsMe: false, reviewRequestedFromMe: false,
      thread: [
        { author: 'rahul', at: ago(6), text: 'Reproduced on staging. Retry path hits the ledger idempotency check twice.' },
        { author: 'arjun', at: ago(2), text: 'Root cause is in the dispatcher change from PR #1279. Fix in progress, ETA 2h.' },
        { author: 'sara', at: ago(0.5), text: 'Rollback plan ready if the fix slips past 6pm.' },
      ],
      related: ['slack-oncall', 'gh-1279'],
    },
    {
      id: 'slack-oncall', source: 'slack', kind: 'message', ref: '#payments-oncall',
      title: 'Checkout p95 latency at 2.4s — need a go/no-go on rollback',
      body: '@neha checkout p95 has been at 2.4s since 9:40am (SLO is 800ms). It lines up with the webhook issue. Do we roll back 4.11.3 now or wait for Arjun\'s fix? Need a decision in the next hour.',
      author: 'sara', assignee: 'neha', channel: '#payments-oncall',
      createdAt: ago(1.2), updatedAt: ago(0.3), dueAt: inH(1), severity: 'critical', status: 'open',
      labels: ['incident', 'decision-needed'], mentionsMe: true, reviewRequestedFromMe: false,
      thread: [
        { author: 'sara', at: ago(1.2), text: '@neha checkout p95 at 2.4s since 9:40. Rollback or wait?' },
        { author: 'arjun', at: ago(0.8), text: 'Fix should be ready in ~2h, but I would not block on me.' },
        { author: 'rahul', at: ago(0.3), text: 'Customer support has 41 tickets about slow checkout so far.' },
      ],
      related: ['jira-482'],
    },
    {
      id: 'gh-1287', source: 'github', kind: 'pr', ref: 'payments-api #1287',
      title: 'Refactor refund service to idempotent handlers',
      body: 'Moves refund processing to idempotent handlers keyed on refund_id. +842 −390 across 14 files. Review requested from @neha three days ago. Blocks PAY-490 investigation.',
      author: 'arjun', assignee: 'neha', channel: 'payments-api',
      createdAt: ago(74), updatedAt: ago(20), dueAt: null, severity: 'high', status: 'open',
      labels: ['needs-review'], mentionsMe: false, reviewRequestedFromMe: true,
      thread: [
        { author: 'arjun', at: ago(74), text: 'Ready for review. Main change is in refund/handlers.ts.' },
        { author: 'arjun', at: ago(20), text: 'Friendly ping @neha — this is blocking the duplicate-refund investigation.' },
      ],
      related: ['jira-490'],
    },
    {
      id: 'jira-475', source: 'jira', kind: 'ticket', ref: 'PAY-475',
      title: 'Release 4.12 sign-off',
      body: 'Manager sign-off required for release 4.12 (KYC v2, refund reports, Android OTP autofill). Release train leaves at 7pm today.',
      author: 'meera', assignee: 'neha', channel: 'Payments Platform',
      createdAt: ago(30), updatedAt: ago(3), dueAt: inH(8), severity: 'high', status: 'open',
      labels: ['release'], mentionsMe: true, reviewRequestedFromMe: false,
      thread: [{ author: 'meera', at: ago(3), text: 'QA sign-off done except Android. Waiting on yours.' }],
      related: ['jira-460', 'slack-rc2'],
    },
    {
      id: 'slack-priya-blocked', source: 'slack', kind: 'message', ref: 'DM · Priya Nair',
      title: 'Priya blocked on KYC flow — waiting on design specs from Meera',
      body: 'Hey Neha, I\'m blocked on PAY-470. The KYC v2 screens still don\'t have final specs for the document-upload step, so I can\'t finish the frontend. Can you help nudge this?',
      author: 'priya', assignee: 'neha', channel: 'Direct message',
      createdAt: ago(3.5), updatedAt: ago(3.5), dueAt: null, severity: 'high', status: 'open',
      blocked: { person: 'priya', waitingOn: 'meera', since: ago(26) },
      labels: ['blocker'], mentionsMe: true, reviewRequestedFromMe: false,
      thread: [{ author: 'priya', at: ago(3.5), text: 'Blocked on PAY-470 — need final upload-step specs.' }],
      related: ['jira-470', 'slack-meera-designs'],
    },
    {
      id: 'email-acme', source: 'email', kind: 'email', ref: 'ops@acmeretail.example',
      title: 'Escalation: settlement reports missing for 14 Oct',
      body: 'Hi Neha, our finance team has not received the T+1 settlement report for 14 October. This is the second miss this month and it is holding up our reconciliation. Please share an ETA today. — Kavita, Operations Lead, Acme Retail (fictional)',
      author: null, authorName: 'Kavita (Acme Retail)', assignee: null, channel: 'Inbox',
      createdAt: ago(2.2), updatedAt: ago(2.2), dueAt: inH(6), severity: 'high', status: 'open',
      labels: ['customer', 'escalation'], mentionsMe: true, reviewRequestedFromMe: false,
      thread: [], related: ['jira-490'],
    },
    {
      id: 'gh-1301', source: 'github', kind: 'issue', ref: 'payments-api #1301',
      title: 'CI flaky: integration tests timing out on main',
      body: 'Integration suite times out on ~40% of runs since yesterday. Merges to main are effectively blocked for the whole team.',
      author: 'rahul', assignee: null, channel: 'payments-api',
      createdAt: ago(18), updatedAt: ago(1.5), dueAt: null, severity: 'high', status: 'open',
      blocked: { person: 'vikram', waitingOn: 'sara', since: ago(18) },
      labels: ['ci', 'blocker'], mentionsMe: false, reviewRequestedFromMe: false,
      thread: [
        { author: 'rahul', at: ago(18), text: 'Timeouts started after the runner image update.' },
        { author: 'vikram', at: ago(1.5), text: 'Can\'t merge the OTP fix until this is green.' },
      ],
      related: ['jira-460'],
    },
    {
      id: 'jira-470', source: 'jira', kind: 'ticket', ref: 'PAY-470',
      title: 'KYC v2 — document upload frontend',
      body: 'Implement the document-upload step for KYC v2 per Figma specs. Status: Blocked (waiting on final design specs).',
      author: 'meera', assignee: 'priya', channel: 'Payments Platform',
      createdAt: ago(96), updatedAt: ago(26), dueAt: inH(30), severity: 'medium', status: 'open',
      blocked: { person: 'priya', waitingOn: 'meera', since: ago(26) },
      labels: ['kyc'], mentionsMe: false, reviewRequestedFromMe: false,
      thread: [{ author: 'priya', at: ago(26), text: 'Marking blocked — upload step specs are missing.' }],
      related: ['slack-priya-blocked', 'slack-meera-designs'],
    },
    {
      id: 'email-vp', source: 'email', kind: 'email', ref: 'vp-eng@company.example',
      title: 'Q4 headcount plan — need your input by tomorrow EOD',
      body: 'Neha, please add your team\'s Q4 hiring needs and justification to the planning sheet by tomorrow EOD. We lock the plan with Finance on Monday.',
      author: null, authorName: 'Anil Kapoor (VP Engineering)', assignee: 'neha', channel: 'Inbox',
      createdAt: ago(5), updatedAt: ago(5), dueAt: inH(32), severity: 'medium', status: 'open',
      labels: ['planning'], mentionsMe: true, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'slack-rc2', source: 'slack', kind: 'message', ref: '#eng-payments',
      title: 'Android 4.12 RC2 is up for QA',
      body: 'RC2 is on the internal track. Includes the OTP autofill crash fix behind a flag.',
      author: 'vikram', assignee: null, channel: '#eng-payments',
      createdAt: ago(4), updatedAt: ago(4), dueAt: null, severity: 'low', status: 'open',
      labels: ['fyi'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: ['jira-475'],
    },
    {
      id: 'gh-1279', source: 'github', kind: 'pr', ref: 'payments-api #1279',
      title: 'Add retry jitter to webhook dispatcher',
      body: 'Merged. Adds exponential backoff with jitter to webhook retries.',
      author: 'arjun', assignee: 'arjun', channel: 'payments-api',
      createdAt: ago(28), updatedAt: ago(9), dueAt: null, severity: 'medium', status: 'done', doneAt: ago(9),
      labels: ['merged'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: ['jira-482'],
    },
    {
      id: 'jira-466', source: 'jira', kind: 'ticket', ref: 'PAY-466',
      title: 'Fix currency rounding in GST invoices',
      body: 'Resolved. Invoices now round at line level per GST rules.',
      author: 'rahul', assignee: 'arjun', channel: 'Payments Platform',
      createdAt: ago(120), updatedAt: ago(4), dueAt: null, severity: 'medium', status: 'done', doneAt: ago(4),
      labels: ['billing'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'slack-rahul-db', source: 'slack', kind: 'message', ref: '#devops-help',
      title: 'Rahul waiting 2 days for staging DB access',
      body: 'Still waiting on read access to the staging ledger DB to finish the refund regression suite. Requested on Wednesday.',
      author: 'rahul', assignee: 'sara', channel: '#devops-help',
      createdAt: ago(48), updatedAt: ago(2), dueAt: null, severity: 'medium', status: 'open',
      blocked: { person: 'rahul', waitingOn: 'sara', since: ago(48) },
      labels: ['access', 'blocker'], mentionsMe: false, reviewRequestedFromMe: false,
      thread: [
        { author: 'rahul', at: ago(48), text: 'Requesting read access to staging-ledger.' },
        { author: 'rahul', at: ago(2), text: 'Bumping this — regression suite is on hold.' },
      ],
      related: [],
    },
    {
      id: 'email-hr', source: 'email', kind: 'email', ref: 'people-team@company.example',
      title: 'Performance review cycle opens Monday',
      body: 'Self-reviews open Monday. Manager reviews are due in three weeks.',
      author: null, authorName: 'People Team', assignee: 'neha', channel: 'Inbox',
      createdAt: ago(7), updatedAt: ago(7), dueAt: null, severity: 'low', status: 'open',
      labels: ['fyi'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'jira-490', source: 'jira', kind: 'ticket', ref: 'PAY-490',
      title: 'Investigate duplicate refund entries in settlement report',
      body: 'Finance spotted duplicate refund lines in the 13–14 Oct settlement files. Likely related to the missing Acme report. Unassigned.',
      author: 'meera', assignee: null, channel: 'Payments Platform',
      createdAt: ago(3), updatedAt: ago(3), dueAt: inH(24), severity: 'high', status: 'open',
      labels: ['customer-impact'], mentionsMe: false, reviewRequestedFromMe: false, thread: [],
      related: ['email-acme', 'gh-1287'],
    },
    {
      id: 'gh-1290', source: 'github', kind: 'pr', ref: 'payments-api #1290',
      title: 'Bump openssl to 3.0.15 (security advisory)',
      body: 'Automated dependency update fixing a high-severity advisory. Needs one approving review.',
      author: null, authorName: 'dependency-bot', assignee: null, channel: 'payments-api',
      createdAt: ago(10), updatedAt: ago(10), dueAt: inH(48), severity: 'high', status: 'open',
      labels: ['security'], mentionsMe: false, reviewRequestedFromMe: true, thread: [], related: [],
    },
    {
      id: 'slack-postmortem', source: 'slack', kind: 'message', ref: '#incidents',
      title: 'Oct 12 outage postmortem needs an owner',
      body: 'We still don\'t have an owner for the Oct 12 card-auth outage postmortem. It is due to leadership next Wednesday.',
      author: 'sara', assignee: null, channel: '#incidents',
      createdAt: ago(8), updatedAt: ago(8), dueAt: inH(120), severity: 'medium', status: 'open',
      labels: ['postmortem'], mentionsMe: true, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'email-1on1', source: 'email', kind: 'email', ref: 'calendar@company.example',
      title: '1:1 with Arjun moved to 4:00 pm',
      body: 'Your 1:1 with Arjun Mehta has been moved to 4:00 pm today.',
      author: null, authorName: 'Calendar', assignee: 'neha', channel: 'Inbox',
      createdAt: ago(1), updatedAt: ago(1), dueAt: null, severity: 'low', status: 'open',
      labels: ['calendar'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'jira-455', source: 'jira', kind: 'ticket', ref: 'PAY-455',
      title: 'Load test for festive-sale traffic (5× baseline)',
      body: 'Run k6 load test at 5× baseline before the festive sale. Owner: Sara.',
      author: 'neha', assignee: 'sara', channel: 'Payments Platform',
      createdAt: ago(140), updatedAt: ago(22), dueAt: inH(72), severity: 'medium', status: 'open',
      labels: ['performance'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'gh-1284', source: 'github', kind: 'pr', ref: 'web-app #1284',
      title: 'Draft: KYC form validation',
      body: 'Work in progress. Not ready for review.',
      author: 'priya', assignee: 'priya', channel: 'web-app',
      createdAt: ago(50), updatedAt: ago(26), dueAt: null, severity: 'low', status: 'open',
      labels: ['draft'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: ['jira-470'],
    },
    {
      id: 'slack-meera-designs', source: 'slack', kind: 'message', ref: '#design-reviews',
      title: 'KYC v2 designs (upload step) ready for your approval',
      body: '@neha I\'ve posted the upload-step designs for KYC v2. Once you approve, Priya can pick them up.',
      author: 'meera', assignee: 'neha', channel: '#design-reviews',
      createdAt: ago(1.8), updatedAt: ago(1.8), dueAt: null, severity: 'medium', status: 'open', unblocks: 'priya',
      labels: ['approval'], mentionsMe: true, reviewRequestedFromMe: false, thread: [],
      related: ['slack-priya-blocked', 'jira-470'],
    },
    {
      id: 'jira-488', source: 'jira', kind: 'ticket', ref: 'PAY-488',
      title: 'SMS vendor API key expires in 2 days',
      body: 'The OTP SMS vendor key expires on Sunday. Rotation needs a production change window.',
      author: 'sara', assignee: 'sara', channel: 'Payments Platform',
      createdAt: ago(20), updatedAt: ago(20), dueAt: inH(44), severity: 'high', status: 'open',
      labels: ['security', 'ops'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'email-finance', source: 'email', kind: 'email', ref: 'finops@company.example',
      title: 'Cloud cost up 32% week-over-week on payments cluster',
      body: 'FinOps flagged a 32% week-over-week cost increase on the payments Kubernetes cluster. Please confirm whether this is expected.',
      author: null, authorName: 'FinOps', assignee: 'neha', channel: 'Inbox',
      createdAt: ago(9), updatedAt: ago(9), dueAt: inH(70), severity: 'medium', status: 'open',
      labels: ['cost'], mentionsMe: true, reviewRequestedFromMe: false, thread: [], related: [],
    },
    {
      id: 'jira-460', source: 'jira', kind: 'ticket', ref: 'PAY-460',
      title: 'Android 14 crash during OTP autofill',
      body: 'Crash rate 1.8% on Android 14 during OTP autofill. Fix ready but merge is blocked by flaky CI.',
      author: 'rahul', assignee: 'vikram', channel: 'Payments Mobile',
      createdAt: ago(60), updatedAt: ago(1.5), dueAt: inH(8), severity: 'high', status: 'open',
      blocked: { person: 'vikram', waitingOn: 'sara', since: ago(18) },
      labels: ['mobile', 'crash'], mentionsMe: false, reviewRequestedFromMe: false, thread: [],
      related: ['gh-1301', 'jira-475'],
    },
    {
      id: 'gh-notes', source: 'github', kind: 'pr', ref: 'web-app #1292',
      title: 'Release notes for 4.12',
      body: 'Merged release notes for 4.12.',
      author: 'meera', assignee: 'meera', channel: 'web-app',
      createdAt: ago(6), updatedAt: ago(2), dueAt: null, severity: 'low', status: 'done', doneAt: ago(2),
      labels: ['merged'], mentionsMe: false, reviewRequestedFromMe: false, thread: [], related: ['jira-475'],
    },
    {
      id: 'slack-offsite', source: 'slack', kind: 'message', ref: '#team-payments',
      title: 'Poll: team offsite dates in November',
      body: 'Vote for offsite dates by next Friday.',
      author: 'meera', assignee: 'neha', channel: '#team-payments',
      createdAt: ago(26), updatedAt: ago(26), dueAt: null, severity: 'low', status: 'open',
      snoozedUntil: inH(20),
      labels: ['team'], mentionsMe: true, reviewRequestedFromMe: false, thread: [], related: [],
    },
  ];
}
