import { z } from "zod";

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationHelper {
  /**
   * Parse and validate pagination parameters
   */
  static parseParams(params: Record<string, unknown>): PaginationParams {
    const page = Math.max(1, parseInt(String(params.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(params.limit)) || 20));
    const sort_by = typeof params.sort_by === "string" && params.sort_by ? params.sort_by : undefined;
    const sort_order = (params.sort_order === "asc" ? "asc" : "desc") as "asc" | "desc";

    return { page, limit, sort_by, sort_order };
  }

  /**
   * Calculate pagination metadata
   */
  static calculateMetadata(
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<unknown>["pagination"] {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Apply pagination to an array
   */
  static paginate<T>(
    data: T[],
    params: PaginationParams
  ): PaginatedResponse<T> {
    const { page, limit, sort_by, sort_order } = params;
    const total = data.length;

    // Sort if requested
    let sortedData = [...data];
    if (sort_by) {
      sortedData.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort_by];
        const bVal = (b as Record<string, unknown>)[sort_by];
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sort_order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sort_order === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    // Slice
    const offset = (page - 1) * limit;
    const paginatedData = sortedData.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: this.calculateMetadata(page, limit, total),
    };
  }

  /**
   * Build pagination response for API
   */
  static buildResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: this.calculateMetadata(page, limit, total),
    };
  }
}
