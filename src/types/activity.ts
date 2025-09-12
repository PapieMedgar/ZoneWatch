export type ActivitySeverity = "info" | "warning" | "safe" | "danger";

export interface Activity {
  id: string;
  type: "kid" | "zone";
  action: string;
  message: string;
  kidId?: string;
  zoneId?: string;
  createdAt: Date;
  severity: ActivitySeverity;
}

export interface CreateActivityData {
  type: "kid" | "zone";
  action: string;
  message: string;
  kidId?: string;
  zoneId?: string;
  severity?: ActivitySeverity;
}


