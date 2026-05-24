import { connectDB } from "@/lib/db/mongoose";
import { Settings, ISettings } from "@/lib/db/models/Settings";

/**
 * Fetches the single Settings document.
 * If none exists, creates the defaults.
 * This is the ONLY way components should access site config.
 */
export async function getSettings(): Promise<ISettings> {
  await connectDB();

  let settings = await Settings.findOne().lean<ISettings>();

  if (!settings) {
    // First-time setup: seed default settings
    settings = (await Settings.create({})).toObject() as ISettings;
  }

  return settings;
}
