/* Colours shared by the HTML interface and the 3D scene. They are defined
   once, as CSS variables in styles/base.css; the scene reads them here so a
   zone colour can't drift between the stack and the model. */
const rootStyle = getComputedStyle(document.documentElement);
const cssVar = name => rootStyle.getPropertyValue(name).trim();

export const zoneColor = zoneId => cssVar(`--zone-${zoneId}`);
export const wellboreColor = horizontal => cssVar(horizontal ? '--wellbore-horizontal' : '--wellbore-directional');
