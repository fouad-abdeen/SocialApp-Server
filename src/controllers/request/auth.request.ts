import {
  IsBoolean,
  IsEmail,
  IsJWT,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignupRequest {
  @MinLength(2, { message: "Username cannot be shorter than 2 characters" })
  @MaxLength(20, { message: "Username cannot be longer than 20 characters" })
  @IsString({ message: "Invalid or missing username" })
  username: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        "Weak password. Password should contain at least 8 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol",
    }
  )
  @IsString({ message: "Invalid or missing password" })
  password: string;

  @IsEmail({}, { message: "Invalid or missing email address" })
  email: string;

  @MinLength(2, { message: "First name cannot be shorter than 2 characters" })
  @MaxLength(50, { message: "First name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid first name" })
  firstName: string;

  @MinLength(2, { message: "Last name cannot be shorter than 2 characters" })
  @MaxLength(50, { message: "Last name cannot be longer than 50 characters" })
  @IsString({ message: "Invalid last name" })
  lastName: string;
}

export class LoginRequest {
  @IsNotEmpty({ message: "Username or email cannot be empty" })
  @IsString({ message: "Invalid or missing username or email" })
  userIdentifier: string;

  @IsNotEmpty({ message: "Password cannot be empty" })
  @IsString({ message: "Invalid or missing password" })
  password: string;
}

export class PasswordResetRequest {
  @IsJWT({ message: "Invalid or missing token" })
  token: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        "Weak password. Password should contain at least 8 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol",
    }
  )
  @IsString({ message: "Invalid or missing password" })
  password: string;
}

export class PasswordUpdateRequest {
  @IsNotEmpty({ message: "Current password cannot be empty" })
  @IsString({ message: "Current password is invalid or missing" })
  currentPassword: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        "New password is weak. It should contain at least 8 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol",
    }
  )
  @IsString({ message: "New password is invalid or missing" })
  newPassword: string;

  @IsOptional()
  @IsBoolean()
  terminateAllSessions?: boolean;
}
