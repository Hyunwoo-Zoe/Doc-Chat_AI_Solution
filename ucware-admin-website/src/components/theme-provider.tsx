"use client";

import * as React from "react";
// 👇 이 부분을 한 줄로 합치고, 직접 타입을 가져옵니다.
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}