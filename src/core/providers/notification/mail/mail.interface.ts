export interface IMailProvider {
  /**
   * Sends an email to the specified email address.
   * @param to recipient name and email address
   * @param subject email subject
   * @param body email body
   */
  sendMail(to: ContactInfo, subject: string, body: string): Promise<void>;
}

export interface ContactInfo {
  name: string;
  email: string;
}
