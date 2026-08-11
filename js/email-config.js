/* WildGuard EmailJS configuration.
   Fill in the three keys from your EmailJS dashboard (https://dashboard.emailjs.com):
     - Service ID   : the Email Service you create there (e.g. your connected Gmail)
     - Template ID  : an Email Template with {{name}} / {{email}} / {{message}} placeholders
     - Public Key   : the Public Key shown on the "Account" page
   toEmail is the WildGuard Gmail inbox that receives contact-form messages.
*/
window.WILDGUARD_EMAIL_CONFIG = {
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  toEmail: 'wildguardsociety@gmail.com',
  fromName: 'WildGuard Society Website'
};
