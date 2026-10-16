/* WildGuard EmailJS configuration.
   ─────────────────────────────────────────────────────────────
   ONE-TIME SETUP (about 10 minutes, free, no server needed):
     1) Sign up free at https://dashboard.emailjs.com
     2) Email Services  → "Add New Service"  → choose **Gmail**
        → connect the Gmail account you want emails sent from.
        → copy the **Service ID** into `serviceId` below.
     3) Email Templates  → "Create New Template" → name it "Welcome".
        Paste this in the template body (placeholders are filled
        automatically by the site):

          Subject: Welcome to WildGuard Society! 🐾
          Content:
          <h2>Karibu, {{user_name}}! 🎉</h2>
          <p>Thank you for joining <strong>WildGuard Society</strong> —
          a youth-led movement protecting wildlife and the land we call home.</p>
          <p>Your account is now active. Here is what you can do:</p>
          <ul>
            <li>🔍 <strong>Scan wildlife</strong> and identify species instantly</li>
            <li>📚 Explore our full <strong>wildlife library</strong></li>
            <li>💚 Save <strong>favourites</strong> and track your sightings</li>
          </ul>
          <p>This is an automated message from <em>WildGuard Society (No-Reply)</em>.
          Please do not reply to this email.</p>

        → In the template, set the **"To Email"** field to `{{to_email}}`
          and the **"From Name"** to `{{from_name}}`.
        → copy the **Template ID** into `welcomeTemplateId` below.

     4) Account  → copy your **Public Key** into `publicKey` below.

     Once those three keys are filled in, welcome emails are sent
     automatically after every registration — from "No-Reply" — and
     no other authentication or configuration is required.
*/
window.WILDGUARD_EMAIL_CONFIG = {
  /* Service connected in EmailJS (your Gmail) */
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',

  /* Contact-form template (optional — used for /contact submissions) */
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID',

  /* Welcome template — the one you created in step 3 above */
  welcomeTemplateId: 'YOUR_EMAILJS_WELCOME_TEMPLATE_ID',

  /* Public key from the EmailJS Account page */
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',

  /* WildGuard inbox that receives contact-form messages */
  toEmail: 'wildguardsociety@gmail.com',

  /* Display name shown as the sender of system emails */
  fromName: 'WildGuard Society (No-Reply)',

  /* Reply-to address for system emails (messages bounce silently) */
  replyTo: 'noreply@wildguard.org'
};