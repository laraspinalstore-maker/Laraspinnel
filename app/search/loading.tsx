/**
 * Segment loading boundary. See components/shared/LoadingScreen.tsx for why the
 * screen lives in a component and is opted into per segment rather than declared
 * once at the app root (short version: a root boundary made invalid product
 * slugs return HTTP 200 instead of 404).
 */
export { default } from "@/components/shared/LoadingScreen";