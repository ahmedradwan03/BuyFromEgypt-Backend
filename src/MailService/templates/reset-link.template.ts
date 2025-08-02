export const resetLinkTemplate = (link: string): string => `
  <h1>Password Reset Link</h1>
  <p>Hello,</p>
  <p>We verified your OTP. Click the button below to reset your password:</p>
  <p><a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
  <p>This link will expire in 5 minutes.</p>
  <p>If you didn't request this, ignore the email.</p>
  <p>Thanks,<br>The Team</p>
`;
