export type ReservationStore = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
};

export type ReservationDraft = {
  storeName: string | null;
  storeAddress: string | null;
  date: Date | null;
  time: string | null;
  note: string;
};

export type ReservationCareType = "FREE" | "PAID";

export type ReservationStatus = "PENDING" | "CONFIRMED";

export type ConfirmedReservation = {
  productName: string;
  storeName: string;
  storeAddress: string;
  serviceName: string;
  date: Date;
  time: string;
  note: string;
  careType: ReservationCareType;
  status: ReservationStatus;
};
