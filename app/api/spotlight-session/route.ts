import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildSafetySpotlightSeenCookieValue,
  SAFETY_SPOTLIGHT_SEEN_COOKIE,
} from "@/lib/safety-spotlights-session";

type Body = { ids?: unknown; replaceAll?: unknown };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : [];
  const replaceAll = body.replaceAll === true;

  const value = buildSafetySpotlightSeenCookieValue({
    previousRaw: (await cookies()).get(SAFETY_SPOTLIGHT_SEEN_COOKIE)?.value,
    ids,
    replaceAll,
  });

  if (!value) {
    return new NextResponse(null, { status: 204 });
  }

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(SAFETY_SPOTLIGHT_SEEN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
