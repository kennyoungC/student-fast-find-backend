import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
export const sendEmail = async (sellerEmail, subject, text) => {
  try {
    const msg = {
      to: sellerEmail,
      from: "obikenneth913@gmail.com",
      subject,
      html: text,
    }
    sgMail.send(msg).then(() => {
      console.log("Email sent")
    })
  } catch (error) {
    console.log(error)
  }
}

export const messageToSend = (productTitle, buyerEmail, message) => `
    <div style="background-color: #f7d4e8; padding: 10px;">
      <p style="color: #ff39b4; font-weight: bold;">Good news!</p>
      <p>Hello,</p>
      <p>
        You have received an enquiry for ${productTitle} from <a href="mailto:${buyerEmail}">${buyerEmail}</a> with
        the following message:
      </p>
      <p style="background-color: #111; color: #fff; padding: 10px; max-width: 400px;">${message}</p>
      <p>Please contact the buyer if the product is still available.</p>
      <p>Thank you,</p>
      <p>Student Fast Find</p>
    </div>
 `
