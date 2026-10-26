"use client";

import React from "react";

export interface SyncRefreshButtonProps {
  onRefreshComplete?: () => void;
  lastSyncTime?: string;
}

/**
 * Siteden veri yenileme özelliği tamamen kaldırılmıştır.
 * Veri çekimi ve yenileme işlemleri yalnızca yerel geliştirici ortamı / CLI üzerinden yürütülmektedir.
 */
export const SyncRefreshButton: React.FC<SyncRefreshButtonProps> = () => {
  return null;
};
