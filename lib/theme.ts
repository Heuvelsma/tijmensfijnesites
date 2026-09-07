export type Theme = "light" | "dark";
export const THEME_KEY = "tfs-theme";

/** Runs before paint so the first frame already has the right theme. Kept tiny on purpose. */
export const themeInitScript = `(function(){try{var k=localStorage.getItem("${THEME_KEY}");var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=k==="light"||k==="dark"?k:(m?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
