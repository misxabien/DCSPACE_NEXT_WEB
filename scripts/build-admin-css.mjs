import fs from "fs";

/** Prefix only selector lines that contain `{` on the same line. */
function prefixCss(css) {
  return css
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("@")) {
        return line;
      }
      if (trimmed === "}" || trimmed.startsWith("}")) {
        return line;
      }
      const brace = line.indexOf("{");
      if (brace === -1) {
        return line;
      }
      const sel = line.slice(0, brace).trim();
      const rest = line.slice(brace);
      if (!sel || sel.startsWith(".admin-app") || sel.startsWith("@")) {
        return line;
      }
      const prefixed = sel
        .split(",")
        .map((s) => {
          s = s.trim();
          if (!s || s.startsWith(".admin-app")) return s;
          return `.admin-app ${s}`;
        })
        .join(", ");
      return line.replace(sel, prefixed);
    })
    .join("\n");
}

const bak = fs.readFileSync("styles/admin.css.bak", "utf8").replace(/^    /gm, "");
const start = bak.indexOf(".header-row");
let components = bak.slice(start);
const polish = components.indexOf("/* Minimal modern design polish */");
if (polish !== -1) components = components.slice(0, polish);
components = prefixCss(components);

const shell = fs.readFileSync("styles/admin-shell-template.css", "utf8");
const modern = fs.readFileSync("styles/admin-components-modern.css", "utf8");
const tap = fs.readFileSync("styles/admin-tap.css", "utf8");

const mediaFix = `
@media (max-width: 1140px) {
  .admin-app .stat { grid-column: span 6; }
}
@media (max-width: 960px) {
  .admin-app .two-col,
  .admin-app .chart-panel,
  .admin-app .ai-panel { grid-column: span 12; }
}
@media (max-width: 680px) {
  .admin-app .stat { grid-column: span 12; }
  .admin-app .metric-row { grid-template-columns: 1fr 1.3fr auto; }
  .admin-app .search-row,
  .admin-app .filter-row { grid-template-columns: 1fr; }
  .admin-app .events-toolbar,
  .admin-app .events-searchbar { grid-template-columns: 1fr; }
  .admin-app .event-card { grid-template-columns: 1fr; }
  .admin-app .event-thumb { width: 100%; }
  .admin-app .detail-grid { grid-template-columns: 1fr; }
  .admin-app .files-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.admin-app .status {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary-strong), var(--primary));
  color: #fff;
  border-radius: var(--radius-pill);
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 100;
  box-shadow: var(--shadow);
}
.admin-app .status.show { opacity: 1; }

/* Toast (rendered outside .admin-app by ShowStatusProvider) */
.status {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #2f6fcd, #4a8dff);
  color: #fff;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 200;
  box-shadow: 0 12px 40px rgba(47, 111, 205, 0.25);
}
.status.show { opacity: 1; }
`;

fs.writeFileSync(
  "styles/admin.css",
  `${shell}\n\n/* Views & components */\n\n${components}\n\n${modern}\n\n${tap}\n${mediaFix}`,
);
console.log("Wrote styles/admin.css", fs.statSync("styles/admin.css").size, "bytes");
