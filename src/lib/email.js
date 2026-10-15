import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export async function sendAdminCredentials({
  toEmail,
  toName,
  password,
  role,
  loginUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : 'https://prototipe-id.vercel.app/login',
}) {
  const roleLabel = role === 'admin_super' ? 'Super Admin' : 'Admin';

  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    password,
    role: roleLabel,
    login_url: loginUrl,
    reply_to: 'noreply@prototipe.id',
  };

  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    return { success: true, result };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: error.text || error.message };
  }
}