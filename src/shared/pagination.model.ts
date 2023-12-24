import { IsMongoId, IsNumber, IsOptional } from "class-validator";

export class Pagination {
  @IsOptional()
  @IsNumber({}, { message: "Invalid pagination limit" })
  limit = 5;

  @IsOptional()
  @IsMongoId({ message: "Invalid last document id" })
  lastDocumentId?: string;
}
