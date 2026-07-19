import nodemailer from 'nodemailer';

/**
 * Sends a confirmation email to the participant when their registration is confirmed by the admin.
 * Uses EMAIL_USER and EMAIL_PASS environment variables.
 */
export async function sendConfirmationEmail({ email, fullName, categoryLabel, bibNumber, mobileNo }) {
  if (!email) {
    console.warn(`No email found for registration of ${fullName}, skipping confirmation email.`);
    return { success: false, message: 'No email address provided.' };
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD; // handle either PASS or PASSWORD name

  if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
    console.warn('Nodemailer credentials are not fully configured in env variables. Skipping email send.');
    return { success: false, message: 'Email credentials not configured.' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Standard default, can be replaced by user
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Boisar Varsha Marathon" <${user}>`,
    to: email,
    subject: 'Registration Confirmed - Boisar Varsha Marathon 2026',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fcfcfc;">
        <div style="background: linear-gradient(135deg, #111111, #222222); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffcc00; margin: 0; font-size: 22px; letter-spacing: 1px;">BOISAR VARSHA MARATHON 2026</h2>
          <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Official Registration Confirmation</p>
        </div>
        
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <p>We are pleased to inform you that your registration for the <strong>Boisar Varsha Marathon 2026</strong> has been officially approved and confirmed by our administration team.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #ffcc00; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Participant Details:</strong></p>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Name:</td>
                <td style="padding: 4px 0; font-weight: bold;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Mobile:</td>
                <td style="padding: 4px 0; font-weight: bold;">${mobileNo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Race Category:</td>
                <td style="padding: 4px 0; font-weight: bold;">${categoryLabel || 'Marathon Track'}</td>
              </tr>
              ${bibNumber ? `
              <tr>
                <td style="padding: 4px 0; color: #666;">BIB Number:</td>
                <td style="padding: 4px 0; font-weight: bold; font-size: 16px; color: #d97706;">${bibNumber}</td>
              </tr>` : ''}
            </table>
          </div>

          <p>If a BIB number has not been assigned yet or says pending, it will be handed over to you along with the runner kit prior to the event start. Details for kit collection will be shared soon.</p>
       
          <div style="background-color: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1b5e20;">
              📢 Join Our Official WhatsApp Community
            </h3>
            <p style="margin: 0 0 15px 0; color: #333;">
              Stay updated with important announcements, race day instructions, runner kit details, event timings, and other marathon updates.
            </p>
            <a href="https://chat.whatsapp.com/ExJdQgsaGBE7i0bPTWHEVr"
              style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 15px;">
              Join WhatsApp Community
            </a>
            <p style="margin-top: 12px; font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="https://chat.whatsapp.com/ExJdQgsaGBE7i0bPTWHEVr" style="color:#0A3D7A;">
                https://chat.whatsapp.com/ExJdQgsaGBE7i0bPTWHEVr
              </a>
            </p>
          </div>

          <p>Please keep this email safe for future reference and verification on the day of the event.</p>
          
          <p style="margin-top: 30px; margin-bottom: 0;">Best Regards,</p>
          <p style="margin: 0; font-weight: bold; color: #0A3D7A;">Organizing Committee</p>
          <p style="margin: 0; font-size: 12px; color: #777;">Aadhar Pratishthan & Shiv Sena</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">This is an automated registration message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent: ${info.messageId} to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send confirmation email via Nodemailer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a rejection email to the participant when their registration is rejected by the admin.
 * Uses EMAIL_USER and EMAIL_PASS environment variables.
 */
export async function sendRejectionEmail({ email, fullName, categoryLabel, mobileNo, reason }) {
  if (!email) {
    console.warn(`No email found for registration of ${fullName}, skipping rejection email.`);
    return { success: false, message: 'No email address provided.' };
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
    console.warn('Nodemailer credentials are not fully configured in env variables. Skipping email send.');
    return { success: false, message: 'Email credentials not configured.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Boisar Varsha Marathon" <${user}>`,
    to: email,
    subject: 'Registration Update - Boisar Varsha Marathon 2026',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fcfcfc;">
        <div style="background: linear-gradient(135deg, #111111, #222222); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffcc00; margin: 0; font-size: 22px; letter-spacing: 1px;">BOISAR VARSHA MARATHON 2026</h2>
          <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Registration Status Update</p>
        </div>
        
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <p>Thank you for your interest in the <strong>Boisar Varsha Marathon 2026</strong>. After reviewing your registration, we regret to inform you that your participation could not be approved at this time.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Registration Details:</strong></p>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Name:</td>
                <td style="padding: 4px 0; font-weight: bold;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Mobile:</td>
                <td style="padding: 4px 0; font-weight: bold;">${mobileNo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Race Category:</td>
                <td style="padding: 4px 0; font-weight: bold;">${categoryLabel || 'Marathon Track'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Status:</td>
                <td style="padding: 4px 0; font-weight: bold; color: #dc2626;">❌ Rejected</td>
              </tr>
              ${reason ? `
              <tr>
                <td style="padding: 4px 0; color: #666; vertical-align: top;">Reason:</td>
                <td style="padding: 4px 0; font-weight: bold;">${reason}</td>
              </tr>` : ''}
            </table>
          </div>

          <p>If you believe this is an error or would like more information, please contact our organizing team directly.</p>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #374151;">Contact the Organizing Team:</p>
            <p style="margin: 0; color: #374151; font-size: 14px;">For queries, reach out to us through official event channels or visit our event page for contact details.</p>
          </div>

          <p>We appreciate your enthusiasm and hope to see you participate in future events.</p>
          
          <p style="margin-top: 30px; margin-bottom: 0;">Best Regards,</p>
          <p style="margin: 0; font-weight: bold; color: #0A3D7A;">Organizing Committee</p>
          <p style="margin: 0; font-size: 12px; color: #777;">Aadhar Pratishthan & Shiv Sena</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">This is an automated registration message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent: ${info.messageId} to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send rejection email via Nodemailer:', error);
    return { success: false, error: error.message };
  }
}
