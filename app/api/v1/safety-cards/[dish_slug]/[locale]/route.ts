import { NextResponse } from "next/server";
import { buildSafetyCardPayload } from "@/lib/safety-card";
import { normalizeSafetyLocale } from "@/lib/supported-locales";

export async function GET(
  _request: Request,
  context: { params: Promise<{ dish_slug: string; locale: string }> },
) {
  const { dish_slug, locale: localeRaw } = await context.params;
  const locale = normalizeSafetyLocale(localeRaw);

  if (!locale) {
    return NextResponse.json(
      { error: "Unsupported locale", supported: ["en", "zh-hans", "th", "sw"] },
      { status: 400 },
    );
  }

  try {
    const payload = await buildSafetyCardPayload(dish_slug, locale);
    if (!payload) {
      return NextResponse.json(
        { error: "Dish or template not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
