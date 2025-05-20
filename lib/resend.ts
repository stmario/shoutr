import { Resend } from "resend"

// Initialize Resend with API key
export const resend = new Resend(process.env.RESEND_API_KEY)

// Email verification template
export const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`

  try {
    const { data, error } = await resend.emails.send({
      from: "Shoutr <verification@yourdomain.com>",
      to: email,
      subject: "Verify your Shoutr account",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Shoutr</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up for Shoutr! Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending verification email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error }
  }
}

// Password reset email template
export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  try {
    const { data, error } = await resend.emails.send({
      from: "Shoutr <reset@yourdomain.com>",
      to: email,
      subject: "Reset your Shoutr password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6d28d9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Shoutr</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your Shoutr password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error }
  }
}
