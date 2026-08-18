/** OpenAPI: UserResponse */
export type MyProfile = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  provider: "LOCAL" | "KAKAO" | string;
  createdAt?: string | null;
};

/** OpenAPI: NotificationSettingResponse */
export type NotificationSetting = {
  careTimingEnabled: boolean;
  reservationEnabled: boolean;
  deviceStatusEnabled: boolean;
  marketingEnabled: boolean;
  environmentAlertEnabled: boolean;
  pushPermissionGranted: boolean;
};

/** OpenAPI: NotificationSettingUpdateRequest */
export type NotificationSettingUpdate = Partial<NotificationSetting> & {
  pushToken?: string;
};

export type ConsentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY"
  | "SENSOR_DATA"
  | "MARKETING";

/** OpenAPI: ConsentStatusResponse */
export type ConsentStatus = {
  consentType: ConsentType;
  agreed: boolean;
  termsVersion?: string | null;
  occurredAt?: string | null;
};

/** OpenAPI: ConsentItem */
export type ConsentItem = {
  consentType: ConsentType;
  action: "AGREED" | "REVOKED";
  termsVersion: string;
};
