import { IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class Pagination {
  @IsNumber({}, { message: "Invalid or missing limit" })
  limit: number;

  @IsOptional()
  @IsMongoId({ message: "Invalid or missing last document id" })
  lastDocumentId?: string;
}
