// src/MaritimeGlobe.jsx
import React, { useRef } from "react";
import Globe from "react-globe.gl";

// Route data as arrays of {lat, lng}
const route1 = [
  { lat: 30.213982, lng: 32.557983 },
  { lat: 30.318359, lng: 32.382202 },
  { lat: 30.945814, lng: 32.306671 },
  { lat: 31.298117, lng: 32.387159 },
  { lat: 31.7, lng: 32.1 },
  { lat: 32.316071, lng: 30.408377 },
  { lat: 32.863395, lng: 28.905525 },
  { lat: 33.115811, lng: 28.212434 },
  { lat: 33.219565, lng: 27.927542 },
  { lat: 33.328, lng: 27.6298 },
  { lat: 33.748752, lng: 26.306431 },
  { lat: 34.011915, lng: 25.478721 },
  { lat: 34.187436, lng: 24.926664 },
  { lat: 34.8, lng: 23.0 },
  { lat: 35.126694, lng: 21.407365 },
  { lat: 35.845726, lng: 17.902084 },
  { lat: 36.086854, lng: 16.726588 },
  { lat: 36.4, lng: 15.2 },
  { lat: 36.907095, lng: 13.263819 },
  { lat: 37.209117, lng: 12.110644 },
  { lat: 37.212689, lng: 12.097004 },
  { lat: 37.215493, lng: 12.086301 },
  { lat: 37.283186, lng: 11.827836 },
  { lat: 37.454891, lng: 11.172235 },
  { lat: 37.5, lng: 11.0 },
  { lat: 37.489085, lng: 10.372293 },
  { lat: 37.4851, lng: 10.1431 },
  { lat: 37.4, lng: 7.5 },
  { lat: 37.2, lng: 3.1 },
  { lat: 36.666667, lng: -0.366667 },
  { lat: 36.473171, lng: -1.62439 },
  { lat: 36.377724, lng: -2.244793 },
  { lat: 36.324512, lng: -2.590675 },
  { lat: 36.220888, lng: -3.264225 },
  { lat: 36.158352, lng: -3.670714 },
  { lat: 36.156455, lng: -3.683043 },
  { lat: 36.0, lng: -4.7 },
  { lat: 35.97289, lng: -5.269383 },
  { lat: 35.968819, lng: -5.354867 },
  { lat: 35.95, lng: -5.75 },
  { lat: 36.31906, lng: -7.26966 },
  { lat: 36.549727, lng: -8.219465 },
  { lat: 36.8, lng: -9.25 },
  { lat: 36.83741, lng: -9.36445 },
  { lat: 37.324914, lng: -10.855872 },
  { lat: 37.417342, lng: -11.138637 },
  { lat: 37.717697, lng: -12.057515 },
  { lat: 38.272734, lng: -13.755544 },
  { lat: 38.5182, lng: -14.5065 },
  { lat: 40.0, lng: -20.0 },
  { lat: 41.125083, lng: -25.565029 },
  { lat: 41.1999, lng: -25.9351 },
  { lat: 41.584862, lng: -28.584901 },
  { lat: 41.790603, lng: -30.001074 },
  { lat: 42.072366, lng: -31.940532 },
  { lat: 42.0901, lng: -32.0626 },
  { lat: 42.340269, lng: -34.863425 },
  { lat: 42.592324, lng: -37.685353 },
  { lat: 42.6501, lng: -38.3322 },
  { lat: 42.706999, lng: -40.001623 },
  { lat: 42.796183, lng: -42.618304 },
  { lat: 42.8665, lng: -44.6814 },
  { lat: 42.807466, lng: -47.493255 },
  { lat: 42.754804, lng: -50.001652 },
  { lat: 42.733, lng: -51.0402 },
  { lat: 42.618612, lng: -52.53975 },
  { lat: 42.613022, lng: -52.613022 },
  { lat: 42.2526, lng: -57.3379 },
  { lat: 41.53046, lng: -62.794754 },
  { lat: 41.4359, lng: -63.5093 },
  { lat: 41.222837, lng: -64.632986 },
  { lat: 40.435954, lng: -68.782982 },
  { lat: 40.430133, lng: -68.813685 },
  { lat: 40.413733, lng: -68.900173 },
  { lat: 40.412386, lng: -68.907278 },
  { lat: 40.311722, lng: -69.43818 },
  { lat: 40.3, lng: -69.5 },
  { lat: 40.419295, lng: -71.289425 },
  { lat: 40.437172, lng: -71.557579 },
  { lat: 40.453237, lng: -71.798554 },
  { lat: 40.535177, lng: -73.027658 },
  { lat: 40.6, lng: -74.0 },
  { lat: 40.6061, lng: -74.0456 },
  { lat: 40.6285, lng: -74.0561 },
  { lat: 40.6676, lng: -74.0488 },
  { lat: 40.7081, lng: -73.9779 }
];

const route2 = [
  { lat: 30.213982, lng: 32.557983 },
  { lat: 29.7, lng: 32.6 },
  { lat: 27.9, lng: 33.75 },
  { lat: 27.0, lng: 34.5 },
  { lat: 23.6, lng: 37.0 },
  { lat: 20.75, lng: 38.9 },
  { lat: 16.3, lng: 41.2 },
  { lat: 15.0, lng: 42.0 },
  { lat: 12.7, lng: 43.3 },
  { lat: 12.40439, lng: 43.746586 },
  { lat: 12.0, lng: 45.0 },
  { lat: 13.0, lng: 51.0 },
  { lat: 12.577758, lng: 53.059021 },
  { lat: 12.2395, lng: 54.7085 },
  { lat: 11.4317, lng: 58.3951 },
  { lat: 11.083455, lng: 59.894005 },
  { lat: 10.866984, lng: 60.825733 },
  { lat: 10.5802, lng: 62.0601 },
  { lat: 10.031585, lng: 64.303249 },
  { lat: 9.934828, lng: 64.698862 },
  { lat: 9.862937, lng: 64.992809 },
  { lat: 9.6889, lng: 65.7044 },
  { lat: 8.881605, lng: 68.858995 },
  { lat: 8.7613, lng: 69.3291 },
  { lat: 8.6701, lng: 69.671733 },
  { lat: 8.582747, lng: 69.999915 },
  { lat: 8.365148, lng: 70.817426 },
  { lat: 8.356493, lng: 70.84994 },
  { lat: 7.8014, lng: 72.9354 },
  { lat: 6.966807, lng: 75.966807 },
  { lat: 6.8131, lng: 76.5251 },
  { lat: 5.8, lng: 80.1 },
  { lat: 5.9, lng: 81.9 },
  { lat: 6.1983, lng: 85.9479 },
  { lat: 6.4664, lng: 90.0 },
  { lat: 6.7, lng: 94.0 },
  { lat: 7.0, lng: 97.0 },
  { lat: 3.2, lng: 100.6 },
  { lat: 2.0, lng: 102.0 },
  { lat: 1.1, lng: 103.6 }
];

// Paths formatted for react-globe.gl
const routes = [
  {
    color: "#ff6600",
    coords: route1.map(p => [p.lat, p.lng])
  },
  {
    color: "#008cff",
    coords: route2.map(p => [p.lat, p.lng])
  }
];

// Flatten all waypoints for dot markers
const waypoints = [
  ...route1.map(p => ({ lat: p.lat, lng: p.lng, color: "#ff6600" })),
  ...route2.map(p => ({ lat: p.lat, lng: p.lng, color: "#008cff" }))
];

function MaritimeGlobe() {
  const globeEl = useRef();

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <Globe
        ref={globeEl}
        height={600}
        width={1000}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        arcsData={routes}
        arcColor={"color"}
        arcDashLength={0.8}
        arcDashGap={0.2}
        arcStroke={2}
        arcAltitude={0.25}
        pointsData={waypoints}
        pointColor={"color"}
        pointAltitude={0.01}
        pointRadius={0.09}
      />
    </div>
  );
}

export default MaritimeGlobe;
