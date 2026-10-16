export class ApiError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class DatabaseUnavailable extends ApiError {
  constructor() {
    super("La base de datos no está disponible.", 503, "DATABASE_UNAVAILABLE");
  }
}

export class DatabasePasswordNotConfigured extends ApiError {
  constructor() {
    super("DB_PASSWORD_NOT_CONFIGURED", 503, "DB_PASSWORD_NOT_CONFIGURED");
  }
}

export class ResourceNotFound extends ApiError {
  constructor(resource) {
    super(`No existe el recurso solicitado: ${resource}.`, 404, "NOT_FOUND");
  }
}

export class SchemaUnsupported extends ApiError {
  constructor(resource) {
    super(`El esquema de PostgreSQL no expone las columnas requeridas para ${resource}.`, 500, "SCHEMA_UNSUPPORTED");
  }
}
