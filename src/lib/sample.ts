// A document pre-indexed in the database so visitors can try the demo
// instantly, with no upload. See scripts/sample doc: Northwind Cloud Product Guide.
export const SAMPLE_DOC = {
  docId: "9c17b138-ef7c-4773-99f7-d1307063178d",
  filename: "Northwind Cloud Product Guide.txt",
  chunks: 2,
  questions: [
    "How much is the Pro plan, and what does it include?",
    "What is your refund policy?",
    "Which plans support SSO?",
  ],
  text: `Northwind Cloud Product Guide

Overview
Northwind Cloud is a project management and team collaboration platform for small and mid-sized teams. It launched in 2021 and is used by over 4,000 companies worldwide.

Plans and Pricing
We offer three plans, billed per user per month. The Starter plan is 9 dollars per user and includes up to 10 projects. The Pro plan is 19 dollars per user and includes unlimited projects, time tracking, and priority support. The Enterprise plan is 39 dollars per user and adds single sign-on (SSO), advanced permissions, and a dedicated account manager. Annual billing saves 20 percent on every plan.

Features
All plans include task boards, file sharing, comments, and a mobile app. Time tracking and custom workflows are available on Pro and Enterprise. The Enterprise plan adds audit logs and SAML-based SSO.

Limits
The Starter plan allows up to 5 GB of file storage per user. Pro allows 50 GB per user. Enterprise has unlimited storage. API rate limits are 100 requests per minute on Starter and Pro, and 1,000 requests per minute on Enterprise.

Security
Data is encrypted in transit and at rest. Northwind Cloud is SOC 2 Type II certified and GDPR compliant. Two-factor authentication is available on all plans.

Support
Starter plan support is email only, with a response time of 48 hours. Pro and Enterprise include priority support with a 4-hour response time during business hours. Enterprise customers also get a dedicated account manager and a 99.9 percent uptime SLA.

Refunds and Cancellation
You can cancel anytime from your account settings. We offer a 30-day money-back guarantee on your first payment. Annual plans are refunded on a pro-rata basis if cancelled within the first 60 days.

Integrations
Northwind Cloud integrates with Slack, Google Drive, GitHub, and Zapier. A public REST API is available on all paid plans.`,
};
