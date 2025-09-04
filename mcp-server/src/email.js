import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || "false") === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("EMAIL_HOST, EMAIL_USER and EMAIL_PASS must be set");
  }

  console.log(`Email config: host=${host}, port=${port}, secure=${secure}, user=${user}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Add debug options for troubleshooting
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });
}

export async function sendEmail({ recipient, subject, body }) {
  try {
    const transporter = getTransport();
    
    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject,
      text: body,
    });
    
    console.log("Email sent successfully:", info.messageId);
    
    return {
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}