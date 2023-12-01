import axios, { AxiosError, AxiosResponse } from "axios";
import { ContactInfo, IMailProvider } from "./mail.interface";
import fs from "fs";
import { BaseService } from "../../../base.service";

export class MailProvider extends BaseService implements IMailProvider {
  private readonly brevoApiUrl: string;
  private readonly brevoApiKey: string;
  private readonly sender: ContactInfo;

  constructor(brevoApiUrl: string, brevoApiKey: string, sender: ContactInfo) {
    super(__filename);
    this.brevoApiUrl = brevoApiUrl;
    this.brevoApiKey = brevoApiKey;
    this.sender = sender;
  }

  async sendMail(
    to: ContactInfo,
    subject: string,
    body: string
  ): Promise<void> {
    await axios
      .post(
        this.brevoApiUrl,
        {
          sender: this.sender,
          to: [to],
          subject,
          htmlContent: body,
        },
        { headers: { "api-key": this.brevoApiKey } }
      )
      .then((response: AxiosResponse) => {
        this._logger.info(
          `Email sent successfully to ${to.name} at ${to.email}!`
        );
        this._logger.info(`Email Message Id: ${response.data.messageId}`);
      })
      .catch((error: AxiosError) => {
        this._logger.error(error.message);
        this._logger.error(JSON.stringify(error.response?.data));
      });
  }

  parseMailTemplate(
    templateType: MailTemplateType,
    data: MailTemplateData
  ): string {
    let template = fs.readFileSync(
      __dirname + "/templates" + `/${templateType}.html`,
      "utf8"
    );

    data["SENDER_NAME"] = this.sender.name;

    Object.keys(data).forEach((key) => {
      template = template.replace(`{{${key}}}`, data[key] as string);
    });

    return template;
  }
}

export enum MailTemplateType {
  EMAIL_VERIFICATION = "email-verification",
  PASSWORD_RESET = "password-reset",
}

export interface MailTemplateData {
  USER_NAME: string;
  CALL_TO_ACTION_URL: string;
  SENDER_NAME?: string;
}
