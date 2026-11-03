/** Shared legal copy — edit `legal/publish.js` then copy to `mobile/src/legal/publish.js`. Last updated: 2026-11-03 */

const CONTACT_EMAIL = "themanifestofficail@gmail.com";
const APP_NAME = "Manifestly AI";

const privacyPolicy = {
  title: "Privacy Policy",
  lastUpdated: "November 3, 2026",
  sections: [
    {
      heading: "Introduction",
      body:
        `${APP_NAME} (“we”, “us”) provides a manifestation and wellness companion app. This Privacy Policy explains what we collect, how we use it, who we share it with, and your choices. By using the app, you agree to this policy.`,
    },
    {
      heading: "Information we collect",
      body:
        "Account information: email address and display name from Supabase Auth when you register or sign in.\n\n" +
        "Profile: optional avatar photo, preferences (theme, language, notification toggles), and onboarding interests.\n\n" +
        "User content you create: journal entries, goals and tasks, vision board images and captions, 369 practice records, AI coach messages, affirmation favorites, and progress activity used for streaks.\n\n" +
        "Subscription status: product identifier and entitlement state if you purchase or activate premium (when billing is enabled).\n\n" +
        "Device permissions: photo library access when you choose an avatar or vision board image; notification permission if you enable reminders.\n\n" +
        "Technical data: API requests may include authentication tokens and standard server logs (timestamps, request IDs) — not used for advertising.",
    },
    {
      heading: "How we use information",
      body:
        "We use your data to operate the app: sync your content across devices, personalize dashboards, schedule local reminders, enforce free/premium limits, generate AI affirmations and coach replies when you request them, and secure your account.\n\n" +
        "We do not sell your personal information. We do not use your journal or vision board content for third-party advertising.",
    },
    {
      heading: "AI processing",
      body:
        "When you use AI-generated affirmations, goal plans, or the AI Coach, the text you submit is sent to our backend and then to Google’s Gemini API to produce a response. Do not enter passwords or payment card numbers into AI features. AI output is for inspiration only — not medical, legal, or financial advice.",
    },
    {
      heading: "Where data is stored",
      body:
        "Authentication: Supabase (Auth).\n\n" +
        "App data: MongoDB (e.g. MongoDB Atlas).\n\n" +
        "Photos: Cloudflare R2 (vision board and profile avatars).\n\n" +
        "API hosting: Render (or equivalent cloud host).\n\n" +
        "Session tokens on your device are stored using the platform secure storage (Expo SecureStore).",
    },
    {
      heading: "Retention",
      body:
        "We keep your data while your account is active. When you delete your account in Settings, we delete associated records in our database and remove your uploaded images from our storage where applicable. Supabase Auth deletion may require a separate step if not fully automated — contact us if you need help.",
    },
    {
      heading: "Your choices",
      body:
        "You can update profile and notification settings in the app, remove your profile photo, delete individual content (journals, boards, goals), sign out, or delete your entire account from Settings.",
    },
    {
      heading: "Children",
      body:
        "The app is not directed at children under 13 (or the minimum age in your country). We do not knowingly collect data from children.",
    },
    {
      heading: "International transfers",
      body:
        "Our service providers may process data in the United States and other countries. We use providers with appropriate safeguards for cross-border processing.",
    },
    {
      heading: "Changes",
      body:
        "We may update this policy. We will revise the “Last updated” date. Continued use after changes means you accept the updated policy.",
    },
    {
      heading: "Contact",
      body: `Questions or privacy requests: ${CONTACT_EMAIL}`,
    },
  ],
};

const termsOfService = {
  title: "Terms of Service",
  lastUpdated: "November 3, 2026",
  sections: [
    {
      heading: "Agreement",
      body: `These Terms govern your use of ${APP_NAME}. If you do not agree, do not use the app.`,
    },
    {
      heading: "Eligibility",
      body:
        "You must be able to form a binding contract in your jurisdiction and meet the minimum age required in your country.",
    },
    {
      heading: "Account",
      body:
        "You are responsible for your login credentials and activity on your account. Notify us if you suspect unauthorized access.",
    },
    {
      heading: "Acceptable use",
      body:
        "Do not misuse the app, attempt to access other users’ data, upload illegal content, reverse engineer the service, or overload our systems. Do not use AI features to generate harmful, abusive, or illegal content.",
    },
    {
      heading: "Wellness disclaimer",
      body:
        `${APP_NAME} offers motivation, journaling, and mindfulness tools. We do not guarantee any specific life, financial, health, or relationship outcome. Content is not a substitute for professional medical, mental health, legal, or financial advice. If you are in crisis, contact local emergency or crisis services.`,
    },
    {
      heading: "AI content",
      body:
        "AI-generated text may be inaccurate or incomplete. You are responsible for how you use it. We may filter or block certain prompts for safety.",
    },
    {
      heading: "Your content",
      body:
        "You retain ownership of content you create. You grant us a license to host, process, and display it solely to operate the app (including backups and image resizing/compression).",
    },
    {
      heading: "Subscriptions",
      body:
        "If premium features are offered, pricing and billing terms will be shown before purchase. Payments are processed by Razorpay (UPI, cards, netbanking, and other methods Razorpay supports). Refunds and chargebacks follow Razorpay and applicable law. Test or sandbox entitlements in non-production builds are for development only.",
    },
    {
      heading: "Termination",
      body:
        "You may stop using the app or delete your account at any time. We may suspend access if you violate these Terms or if required by law.",
    },
    {
      heading: "Limitation of liability",
      body:
        "To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid us in the twelve months before the claim, or zero if you use the free tier.",
    },
    {
      heading: "Changes",
      body:
        "We may update these Terms. Material changes will be reflected by updating the “Last updated” date. Continued use constitutes acceptance.",
    },
    {
      heading: "Contact",
      body: `Questions: ${CONTACT_EMAIL}`,
    },
  ],
};

module.exports = {
  CONTACT_EMAIL,
  APP_NAME,
  privacyPolicy,
  termsOfService,
};
