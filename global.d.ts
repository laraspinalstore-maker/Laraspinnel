import React from "react";

declare global {
  /**
   * Bridges the legacy global `JSX` namespace to React 19's own, so `JSX.Element`
   * and `JSX.IntrinsicElements` still resolve in files written before React 19
   * moved them under `React.JSX`.
   *
   * `IntrinsicElements` is a type alias rather than an empty interface extending
   * the React one: an interface declaring no members is identical to its
   * supertype, which `@typescript-eslint/no-empty-object-type` reports, and the
   * alias expresses the same thing without pretending to add members.
   */
  namespace JSX {
    type IntrinsicElements = React.JSX.IntrinsicElements;
    type Element = React.ReactNode;
  }
}
