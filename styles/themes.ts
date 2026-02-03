import { type DefaultTheme } from "styled-components";
import breezeTheme from "styles/breezeTheme";
import defaultTheme from "styles/defaultTheme";

const themes = { breezeTheme, defaultTheme };

export type ThemeName = keyof typeof themes;

export default themes as Record<ThemeName, DefaultTheme>;
