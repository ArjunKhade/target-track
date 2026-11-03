declare module 'leaflet-ant-path' {
  import * as L from 'leaflet';

  export interface AntPathOptions extends L.PolylineOptions {
    paused?: boolean;
    delay?: number;
    dashArray?: [number, number] | number[];
    weight?: number;
    opacity?: number;
    color?: string;
    pulseColor?: string;
    reverse?: boolean;
    hardwareAccelerated?: boolean;
  }

  export function antPath(
    latlngs: L.LatLngExpression[] | L.LatLngExpression[][],
    options?: AntPathOptions
  ): L.Polyline;
}

