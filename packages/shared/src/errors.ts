export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TenantScopeError extends AppError {
  constructor(message = 'tenant scope missing or invalid') {
    super(message, 'TENANT_SCOPE', 403);
    this.name = 'TenantScopeError';
  }
}

export class CostCapExceededError extends AppError {
  constructor(message = 'tenant cost cap exceeded') {
    super(message, 'COST_CAP_EXCEEDED', 429);
    this.name = 'CostCapExceededError';
  }
}
