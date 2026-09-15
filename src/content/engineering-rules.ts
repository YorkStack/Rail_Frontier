export const ENGINEERING_RULES_VERSION=1;
export const engineeringRules=Object.freeze({
  version:ENGINEERING_RULES_VERSION,
  maxAlignmentPoints:128,
  minimumPointSpacingM:10,
  joinPositionToleranceM:.001,
  joinTangentToleranceRadians:.015
});

export function requireEngineeringRulesVersion(version:number|undefined):void {
  if((version??ENGINEERING_RULES_VERSION)!==ENGINEERING_RULES_VERSION)throw new Error('Engineering rules have changed');
}
