import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { facilities, patientProfiles } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();

router.use(requireAuth);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortAmbulanceFirstThenName(a: { type: string; name: string }, b: { type: string; name: string }) {
  if (a.type === "ambulance" && b.type !== "ambulance") return -1;
  if (b.type === "ambulance" && a.type !== "ambulance") return 1;
  return a.name.localeCompare(b.name);
}

router.get("/", async (req, res) => {
  const profileRows = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.patientId, req.user!.id))
    .execute();
  const locationAllowed = profileRows[0]?.shareLocation === true;

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const rows = await db.select().from(facilities).execute();
  const list = rows.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    capability: f.capability,
    address: f.address,
    phone: f.phone,
    openHours: f.openHours
  }));

  if (!locationAllowed) {
    res.json({
      locationUsed: false,
      note:
        "Distances are hidden because location sharing is off. Turn on location sharing in your profile if you want distances.",
      facilities: list.sort((a, b) => a.type.localeCompare(b.type))
    });
    return;
  }

  if (!hasCoords) {
    res.json({
      locationUsed: false,
      note:
        "Your location was not sent, so distances are not shown. Nothing was used to sort by distance.",
      facilities: list.sort(sortAmbulanceFirstThenName)
    });
    return;
  }

  const withDistance = list.map((f) => {
    const row = rows.find((r) => r.id === f.id)!;
    return { ...f, distanceKm: Number(haversineKm(lat, lng, row.latitude, row.longitude).toFixed(1)) };
  });

  withDistance.sort((a, b) => {
    if (a.type === "ambulance" && b.type !== "ambulance") return -1;
    if (b.type === "ambulance" && a.type !== "ambulance") return 1;
    return a.distanceKm - b.distanceKm;
  });

  res.json({
    locationUsed: true,
    note: "Distances are straight-line estimates from the location you shared.",
    facilities: withDistance
  });
});

export default router;
