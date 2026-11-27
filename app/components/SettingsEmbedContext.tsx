"use client";
import {createContext} from "react";
export type EmbeddedEditorTab="profile"|"avatar"|"header"|"live"|"shahada"|"analytics";
/** Only populated while the real profile editor renders inside global Settings. */
export const SettingsEmbedContext=createContext<EmbeddedEditorTab|undefined>(undefined);
