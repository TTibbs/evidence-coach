import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Evidence Coach Capture",
    description: "Capture job descriptions and open them as Evidence Coach drafts.",
    permissions: ["activeTab", "scripting", "storage"],
    host_permissions: ["*://*.linkedin.com/*", "http://localhost:3000/*"],
    action: {
      default_title: "Capture job description",
    },
  },
});
