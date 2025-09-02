export const otpTemplate = (otp: string): string => `
  <h1>Password Reset Request</h1>
  <p>Hello,</p>
  <p>We received a request to reset your password. Please use the following OTP code to continue:</p>
  <h2 style="background-color: #f4f4f4; padding: 10px; text-align: center;">${otp}</h2>
  <p>This code will expire in 5 minutes.</p>
  <p>If you did not request this, ignore the email or contact support.</p>
  <p>Thanks,<br>The Team</p>
`;
