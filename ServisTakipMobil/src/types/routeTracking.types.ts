export type ServiceDirection = 'MORNING' | 'EVENING';

export interface RouteAnchor {
  label: string;
  latitude: number;
  longitude: number;
}

export interface PassengerWaypoint {
  id: number | string;
  passengerId: string;
  label: string;
  time: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

export interface ServiceRouteModel {
  routeId: string;
  name: string;
  number: string;
  routeCode: string;
  plate: string;
  vehicleModel: string;
  capacity: number;
  origin: RouteAnchor;
  destination: RouteAnchor;
  waypoints: PassengerWaypoint[];
}