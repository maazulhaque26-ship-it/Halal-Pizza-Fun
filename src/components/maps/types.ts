export interface BranchMapBranch {
  _id: string;
  name: string;
  contactNumber?: string;
  deliveryRadiusKm: number;
  isActive?: boolean;
  isAcceptingOrders?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  operatingHours?: {
    open?: string;
    close?: string;
  };
  location: {
    type?: "Point";
    coordinates: number[];
  };
}

export interface MapPoint {
  lat: number;
  lng: number;
}
