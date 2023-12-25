# SocialApp Server

Welcome to the SocialApp Server repository! This is the backend codebase for SocialApp, a straightforward social media web application that enables users to compose short tweets (posts), follow one another, and actively engage with shared content.

## Table of Contents

- [Introduction](#introduction)
- [Project Features and User Stories](#project-features-and-user-stories)
- [Technologies](#technologies)
- [Dependencies](#dependencies)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [MongoDB](#mongodb)
  - [Tebi](#tebi)
  - [Brevo](#brevo)
- [Configuration](#configuration)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Architecture Overview](#architecture-overview)
- [Design Pattern: Controller-Service-Repository](#design-pattern-controller-service-repository)

## Introduction

SocialApp is currently in its early stages, with the backend under active development. The goal is to create a user-friendly and interactive platform for connecting people, sharing thoughts, and fostering meaningful interactions. The focus is on building strong server-side functionalities, laying the foundation for the upcoming frontend.

## Project Features and User Stories

For a detailed overview of the project's features and user stories, please refer to this [document](https://vast-individual-bc1.notion.site/Feature-Specification-and-User-Stories-a670f45a104341eb878ea442f6a159d4).

## Technologies

- **Runtime:** Node.js
- **Web Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB
- **Authentication:** JWT and Bcrypt
- **Mail Service:** Brevo
- **File Storage:** AWS S3

## Dependencies

- **AWS SDK for S3:** [aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3)

  - Used for interacting with AWS S3 for file storage.

- **AWS S3 Request Presigner:** [@aws-sdk/s3-request-presigner](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner)

  - A utility for presigning S3 requests.

- **Typegoose:** [@typegoose/typegoose](https://www.npmjs.com/package/@typegoose/typegoose)

  - Provides TypeScript support for MongoDB modeling.

- **Axios:** [axios](https://www.npmjs.com/package/axios)

  - A promise-based HTTP client for making requests to external APIs.

- **Bcrypt:** [bcrypt](https://www.npmjs.com/package/bcrypt)

  - Used for hashing passwords for secure storage.

- **Class Validator:** [class-validator](https://www.npmjs.com/package/class-validator)

  - Provides decorators for input validation.

- **Compression:** [compression](https://www.npmjs.com/package/compression)

  - Middleware to compress HTTP responses.

- **Cookie Parser:** [cookie-parser](https://www.npmjs.com/package/cookie-parser)

  - Parses and handles HTTP cookies.

- **CORS:** [cors](https://www.npmjs.com/package/cors)

  - Middleware to enable Cross-Origin Resource Sharing.

- **Dotenv:** [dotenv](https://www.npmjs.com/package/dotenv)

  - Loads environment variables from a .env file.

- **Express:** [express](https://www.npmjs.com/package/express)

  - Web application framework for Node.js.

- **Express HTTP Context:** [express-http-context](https://www.npmjs.com/package/express-http-context)

  - Enables access to contextual data across middleware and routes.

- **File System (fs):** [fs](https://www.npmjs.com/package/fs)

  - Node.js module for interacting with the file system.

- **Helmet:** [helmet](https://www.npmjs.com/package/helmet)

  - Middleware to enhance HTTP security headers.

- **JSON Web Token (JWT):** [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

  - Generates and verifies JSON web tokens.

- **Mongoose:** [mongoose](https://www.npmjs.com/package/mongoose)

  - MongoDB object modeling tool.

- **Morgan:** [morgan](https://www.npmjs.com/package/morgan)

  - HTTP request logger middleware.

- **NanoID:** [nanoid](https://www.npmjs.com/package/nanoid)

  - A tiny, secure, URL-friendly unique string ID generator.

- **Reflect Metadata:** [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)

  - Provides metadata reflection capabilities.

- **Routing Controllers:** [routing-controllers](https://www.npmjs.com/package/routing-controllers)

  - Decorator-based routing for Express applications.

- **Routing Controllers OpenAPI:** [routing-controllers-openapi](https://www.npmjs.com/package/routing-controllers-openapi)

  - Generates OpenAPI (Swagger) specifications for routing controllers.

- **Swagger UI Express:** [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)

  - Middleware to serve Swagger UI for API documentation.

- **Typedi:** [typedi](https://www.npmjs.com/package/typedi)

  - Dependency injection container for TypeScript.

- **Winston:** [winston](https://www.npmjs.com/package/winston)
  - Versatile logging library for Node.js.

## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) - Node Package Manager
- [MongoDB](https://www.mongodb.com/try/download/community) (optional)

Ensure you have accounts on Tebi (for file storage) and Brevo (for mail service)

- [Tebi](https://tebi.io/)
- [Brevo](https://developers.brevo.com/)

## Setup

### MongoDB

1. Install MongoDB by choosing one of the below options:

- Download the appropriate MongoDB version for your operating system from the [MongoDB website](https://www.mongodb.com/try/download/community) and follow their installation instructions.
- Create a free MongoDB cluster (shared one) on [Atlas](https://www.mongodb.com/cloud/atlas).
- Install MongoDB using [Docker](https://hub.docker.com/_/mongo/) if you prefer to use Docker.

2. To connect to and control MongoDB:

- Use MongoDB Compass ([install it here](https://www.mongodb.com/try/download/compass) if you don't already have it installed).
- You can use MongoDB Atlas if you're using a deployed MongoDB cluster.

### Tebi

1. Create a free account on [the platform](https://tebi.io/).

2. Add a bucket with the following name: **social-app**.

### Brevo

1. Create a free account on [the platform](https://developers.brevo.com/).

2. Generate a new API key to access the mail service.

## Getting Started

1. Clone this repository: `git clone https://github.com/fouad-abdeen/SocialApp-Server.git`
2. Change into the project directory: `cd Social-App-Server`

## Configuration

Before running the server, configure the environment variables. Create a `.env` file in the root of the project with the following content (make sure to replace the value for each variable):

```env
# JWT Secret Key
JWT_SECRET=[YOUR_SECRET_KEY]

# AWS S3 Configuration
AWS_S3_ACCESS_KEY_ID=[YOUR_S3_ACCESS_KEY_ID]
AWS_S3_SECRET_ACCESS_KEY=[YOUR_S3_SECRET_ACCESS_KEY]

# Brevo Mail Service Configuration
BREVO_SENDER_NAME=[YOUR_NAME]
BREVO_SENDER_MAIL_ADDRESS=[YOUR_MAIL_ADDRESS]
BREVO_API_KEY=[YOUR_BREVO_API_KEY]
```

Notes:

- To configure AWS S3, get the credentials from your Tebi account, use either a master key or a bucket key.
- Make sure to add the below variable to .env file if you're using a MongoDB cluster on Atlas:

  MONGODB_HOST=mongodb+srv://[USERNAME]:[PASSWORD]@sandbox.pim8u.mongodb.net/

- To view default env variables, go to `/src/core/config/env.config.ts`. You can replace any other variable if needed.

## Installation

Install project dependencies:

```bash
npm install
```

## Running the Server

Before starting the server, you may want to seed the database with a list of users. To do this, run the following command:

```bash
npm run seed-database
```

This command will populate your database with the users defined in the `./database-scripts/database-seed.ts` file.

To start the server in normal mode:

```bash
npm start
```

To start the server in production mode:

```bash
npm run prod
```

To start the server in development mode:

```bash
npm run dev
```

The server will be running at http://localhost:3030 by default.

## API Documentation

The API documentation for the SocialApp backend is generated using Swagger. You can access the Swagger UI by visiting the following link:

[Swagger API Documentation](http://localhost:3030/docs)

This documentation provides a detailed overview of the available endpoints, request/response schemas, and allows you to interact with the API directly from the Swagger UI.

Note: Make sure the backend server is running before accessing the Swagger documentation.

## Architecture Overview

The application's architecture is organized into several key directories, each with a distinct purpose:

1. `Controllers` (./controllers): Controllers are the primary entry point for the application, handling incoming HTTP requests. The directory includes:

   - `request`: Defines request types and handles validation using the class-validator library.
   - `response`: Defines response types and modifies the response before it's handled by the response interceptor.

2. `Core` (./core): The Core directory contains fundamental functionalities crucial for the application's operation. It includes:

   - `config`: Stores configuration files to manage various settings.
   - `interceptors`: Contains an interceptor that handle response processing.
   - `middlewares`: Houses middleware functions for request processing.
   - `providers`: Holds service providers for external service integrations.
   - `utils`: Contains utility functions.

3. `Models` (./models): Models contain the database models used throughout the application, defining the structure of the data in the database and ensuring consistency in data handling.

4. `Repositories` (./repositories): Repositories handle data access tasks and interact directly with the database or other data sources. The directory includes:

   - `interfaces`: Hosts interfaces that define the contract for repositories.

5. `Services` (./services): Services encapsulate the core business logic of the application. They validate data, execute operations, and interact with repositories to ensure seamless communication between controllers and data sources.

This architectural organization promotes separation of concerns, enhancing the application's maintainability and scalability. The design ensures efficient request handling and response processing, providing a clean and modular structure that contributes to the overall robustness of the application.

## Design Pattern: Controller-Service-Repository

The Controller-Service-Repository pattern promotes separation of concerns and modular design. Each component has a specific role:

- `Controller`: Acts as an interface between the client and the application. It processes the request and returns the response.

- `Service`: Holds the core business logic. It processes the data, applying any necessary transformations or calculations.

- `Repository`: Manages data persistence. It abstracts the underlying data source, providing a set of methods for data manipulation.
