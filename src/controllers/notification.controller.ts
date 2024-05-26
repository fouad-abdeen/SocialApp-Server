import {
  Authorized,
  Get,
  JsonController,
  QueryParams,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseService, Context } from "../core";
import { NotificationRepository } from "../repositories";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Pagination } from "../shared/pagination.model";
import { NotificationResponse } from "./response";

@JsonController("/notifications")
@Service()
export class FileController extends BaseService {
  constructor(private _notificationRepository: NotificationRepository) {
    super(__filename);
  }

  // #region Get Notifications
  @Authorized()
  @Get("/")
  @OpenAPI({
    summary: "Get user notifications",
    description: `
      Get a list of notifications of a user.
      The notifications are paginated and sorted in descending order of creation date.
      limit: limit of documents to return, default is 5.
      lastDocumentId: id of the last document in the previous page. If not provided, it will return the first page.
      `,
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(NotificationResponse, { isArray: true })
  async getNotifications(
    @QueryParams() pagination: Pagination
  ): Promise<NotificationResponse[]> {
    const userId = Context.getUser()._id;

    this.setRequestId();
    this._logger.info(`Received a request to get notifications for: ${userId}`);

    const notifications = await this._notificationRepository.getNotifications(
      pagination,
      userId
    );

    return NotificationResponse.getNotificationsListResponse(notifications);
  }
  // #endregion
}
