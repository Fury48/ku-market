const path = require('path');
const nodemailer = require('nodemailer');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function getMailConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw Object.assign(new Error('메일 발송 환경변수가 설정되지 않았습니다.'), { statusCode: 500 });
  }

  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false',
    auth: { user, pass },
    from: process.env.MAIL_FROM || `Horang Market <${user}>`,
  };
}

function createTransporter() {
  const config = getMailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

async function sendVerificationEmail(to, code) {
  const config = getMailConfig();
  const transporter = createTransporter();
  const appName = process.env.APP_NAME || 'Horang Market';

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `[${appName}] 고려대학교 이메일 인증번호`,
    text: `${appName} 회원가입 인증번호는 ${code} 입니다. 인증번호는 ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10}분 동안 유효합니다.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin-bottom: 12px;">${appName} 이메일 인증</h2>
        <p>회원가입을 계속하려면 아래 인증번호를 입력해 주세요.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 20px 0;">${code}</p>
        <p>인증번호는 ${process.env.VERIFICATION_CODE_TTL_MINUTES || 10}분 동안 유효합니다.</p>
      </div>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
};
