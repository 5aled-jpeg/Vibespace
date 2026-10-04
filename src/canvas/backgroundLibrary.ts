/**
 * Canvas Background Library
 * 9 Custom SVG background patterns with light & dark theme adaptivity.
 */

export interface BackgroundPattern {
  id: string;
  name: string;
  description: string;
  svgRaw: string;
  getSvg: (isDark: boolean) => string;
}

const DOT_MATRIX_RAW = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <g clip-path="url(#clip0_87_185644)"> <path d="M46 50H45V49H46V50ZM50 50H49V49H50V50ZM47 49H46V48H47V49ZM49 49H48V48H49V49ZM48 48H47V47H48V48ZM47 47H46V46H47V47ZM49 47H48V46H49V47ZM46 46H45V45H46V46ZM50 46H49V45H50V46Z" fill="#0E0E0E"></path> <path d="M46 2H45V1H46V2ZM50 2H49V1H50V2ZM47 1H46V0H47V1ZM49 1H48V0H49V1ZM48 0H47V-1H48V0ZM47 -1H46V-2H47V-1ZM49 -1H48V-2H49V-1ZM46 -2H45V-3H46V-2ZM50 -2H49V-3H50V-2Z" fill="#0E0E0E"></path> <path d="M46 14H45V13H46V14ZM50 14H49V13H50V14ZM47 13H46V12H47V13ZM49 13H48V12H49V13ZM48 12H47V11H48V12ZM47 11H46V10H47V11ZM49 11H48V10H49V11ZM46 10H45V9H46V10ZM50 10H49V9H50V10Z" fill="#0E0E0E"></path> <path d="M-2 50H-3V49H-2V50ZM2 50H1V49H2V50ZM-1 49H-2V48H-1V49ZM1 49H0V48H1V49ZM0 48H-1V47H0V48ZM-1 47H-2V46H-1V47ZM1 47H0V46H1V47ZM-2 46H-3V45H-2V46ZM2 46H1V45H2V46Z" fill="#0E0E0E"></path> <path d="M-2 2H-3V1H-2V2ZM2 2H1V1H2V2ZM-1 1H-2V0H-1V1ZM1 1H0V0H1V1ZM0 0H-1V-1H0V0ZM-1 -1H-2V-2H-1V-1ZM1 -1H0V-2H1V-1ZM-2 -2H-3V-3H-2V-2ZM2 -2H1V-3H2V-2Z" fill="#0E0E0E"></path> <path d="M-2 14H-3V13H-2V14ZM2 14H1V13H2V14ZM-1 13H-2V12H-1V13ZM1 13H0V12H1V13ZM0 12H-1V11H0V12ZM-1 11H-2V10H-1V11ZM1 11H0V10H1V11ZM-2 10H-3V9H-2V10ZM2 10H1V9H2V10Z" fill="#0E0E0E"></path> <path d="M22 26H21V25H22V26ZM26 26H25V25H26V26ZM23 25H22V24H23V25ZM25 25H24V24H25V25ZM24 24H23V23H24V24ZM23 23H22V22H23V23ZM25 23H24V22H25V23ZM22 22H21V21H22V22ZM26 22H25V21H26V22Z" fill="#0E0E0E"></path> <path d="M22 38H21V37H22V38ZM26 38H25V37H26V38ZM23 37H22V36H23V37ZM25 37H24V36H25V37ZM24 36H23V35H24V36ZM23 35H22V34H23V35ZM25 35H24V34H25V35ZM22 34H21V33H22V34ZM26 34H25V33H26V34Z" fill="#0E0E0E"></path> <path d="M46 26H45V25H46V26ZM50 26H49V25H50V26ZM47 25H46V24H47V25ZM49 25H48V24H49V25ZM48 24H47V23H48V24ZM47 23H46V22H47V23ZM49 23H48V22H49V23ZM46 22H45V21H46V22ZM50 22H49V21H50V22Z" fill="#0E0E0E"></path> <path d="M46 38H45V37H46V38ZM50 38H49V37H50V38ZM47 37H46V36H47V37ZM49 37H48V36H49V37ZM48 36H47V35H48V36ZM47 35H46V34H47V35ZM49 35H48V34H49V35ZM46 34H45V33H46V34ZM50 34H49V33H50V34Z" fill="#0E0E0E"></path> <path d="M-2 26H-3V25H-2V26ZM2 26H1V25H2V26ZM-1 25H-2V24H-1V25ZM1 25H0V24H1V25ZM0 24H-1V23H0V24ZM-1 23H-2V22H-1V23ZM1 23H0V22H1V23ZM-2 22H-3V21H-2V22ZM2 22H1V21H2V22Z" fill="#0E0E0E"></path> <path d="M-2 38H-3V37H-2V38ZM2 38H1V37H2V38ZM-1 37H-2V36H-1V37ZM1 37H0V36H1V37ZM0 36H-1V35H0V36ZM-1 35H-2V34H-1V35ZM1 35H0V34H1V35ZM-2 34H-3V33H-2V34ZM2 34H1V33H2V34Z" fill="#0E0E0E"></path> <path d="M22 50H21V49H22V50ZM26 50H25V49H26V50ZM23 49H22V48H23V49ZM25 49H24V48H25V49ZM24 48H23V47H24V48ZM23 47H22V46H23V47ZM25 47H24V46H25V47ZM22 46H21V45H22V46ZM26 46H25V45H26V46Z" fill="#0E0E0E"></path> <path d="M22 2H21V1H22V2ZM26 2H25V1H26V2ZM23 1H22V0H23V1ZM25 1H24V0H25V1ZM24 0H23V-1H24V0ZM23 -1H22V-2H23V-1ZM25 -1H24V-2H25V-1ZM22 -2H21V-3H22V-2ZM26 -2H25V-3H26V-2Z" fill="#0E0E0E"></path> <path d="M22 14H21V13H22V14ZM26 14H25V13H26V14ZM23 13H22V12H23V13ZM25 13H24V12H25V13ZM24 12H23V11H24V12ZM23 11H22V10H23V11ZM25 11H24V10H25V11ZM22 10H21V9H22V10ZM26 10H25V9H26V10Z" fill="#0E0E0E"></path> <path d="M10 14H9V13H10V14ZM14 14H13V13H14V14ZM11 13H10V12H11V13ZM13 13H12V12H13V13ZM12 12H11V11H12V12ZM11 11H10V10H11V11ZM13 11H12V10H13V11ZM10 10H9V9H10V10ZM14 10H13V9H14V10Z" fill="#0E0E0E"></path> <path d="M10 26H9V25H10V26ZM14 26H13V25H14V26ZM11 25H10V24H11V25ZM13 25H12V24H13V25ZM12 24H11V23H12V24ZM11 23H10V22H11V23ZM13 23H12V22H13V23ZM10 22H9V21H10V22ZM14 22H13V21H14V22Z" fill="#0E0E0E"></path> <path d="M10 50H9V49H10V50ZM14 50H13V49H14V50ZM11 49H10V48H11V49ZM13 49H12V48H13V49ZM12 48H11V47H12V48ZM11 47H10V46H11V47ZM13 47H12V46H13V47ZM10 46H9V45H10V46ZM14 46H13V45H14V46Z" fill="#0E0E0E"></path> <path d="M10 2H9V1H10V2ZM14 2H13V1H14V2ZM11 1H10V0H11V1ZM13 1H12V0H13V1ZM12 0H11V-1H12V0ZM11 -1H10V-2H11V-1ZM13 -1H12V-2H13V-1ZM10 -2H9V-3H10V-2ZM14 -2H13V-3H14V-2Z" fill="#0E0E0E"></path> <path d="M10 38H9V37H10V38ZM14 38H13V37H14V38ZM11 37H10V36H11V37ZM13 37H12V36H13V37ZM12 36H11V35H12V36ZM11 35H10V34H11V35ZM13 35H12V34H13V35ZM10 34H9V33H10V34ZM14 34H13V33H14V34Z" fill="#0E0E0E"></path> <path d="M34 14H33V13H34V14ZM38 14H37V13H38V14ZM35 13H34V12H35V13ZM37 13H36V12H37V13ZM36 12H35V11H36V12ZM35 11H34V10H35V11ZM37 11H36V10H37V11ZM34 10H33V9H34V10ZM38 10H37V9H38V10Z" fill="#0E0E0E"></path> <path d="M34 26H33V25H34V26ZM38 26H37V25H38V26ZM35 25H34V24H35V25ZM37 25H36V24H37V25ZM36 24H35V23H36V24ZM35 23H34V22H35V23ZM37 23H36V22H37V23ZM34 22H33V21H34V22ZM38 22H37V21H38V22Z" fill="#0E0E0E"></path> <path d="M34 50H33V49H34V50ZM38 50H37V49H38V50ZM35 49H34V48H35V49ZM37 49H36V48H37V49ZM36 48H35V47H36V48ZM35 47H34V46H35V47ZM37 47H36V46H37V47ZM34 46H33V45H34V46ZM38 46H37V45H38V46Z" fill="#0E0E0E"></path> <path d="M34 2H33V1H34V2ZM38 2H37V1H38V2ZM35 1H34V0H35V1ZM37 1H36V0H37V1ZM36 0H35V-1H36V0ZM35 -1H34V-2H35V-1ZM37 -1H36V-2H37V-1ZM34 -2H33V-3H34V-2ZM38 -2H37V-3H38V-2Z" fill="#0E0E0E"></path> <path d="M34 38H33V37H34V38ZM38 38H37V37H38V38ZM35 37H34V36H35V37ZM37 37H36V36H37V37ZM36 36H35V35H36V36ZM35 35H34V34H35V35ZM37 35H36V34H37V35ZM34 34H33V33H34V34ZM38 34H37V33H38V34Z" fill="#0E0E0E"></path> </g> <defs> <clipPath id="clip0_87_185644"> <rect width="48" height="48" fill="white"></rect> </clipPath> </defs> </g></svg>`;

export const CANVAS_BACKGROUNDS: BackgroundPattern[] = [
  // 1. Clean / Blank
  {
    id: 'blank',
    name: 'Clean Canvas',
    description: 'Solid minimal canvas with zero lines',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/></svg>`;
    },
  },

  // 2. Vertical Lines
  {
    id: 'vertical-lines',
    name: 'Vertical Columns',
    description: 'Vertical linear guides for document alignment',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <path d="M47.5 0V48" stroke="#1C1F21"></path> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const stroke = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.15"> <path d="M47.5 0V48" stroke="${stroke}"></path> </g></svg>`;
    },
  },

  // 3. Large Grid
  {
    id: 'grid',
    name: 'Classic Grid',
    description: '48px square cells for spatial node layout',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <path d="M47.5 0V48" stroke="#1C1F21"></path> </g><g opacity="0.15"> <path d="M48 47.5001H0" stroke="#1C1F21"></path> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const stroke = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.15"> <path d="M47.5 0V48" stroke="${stroke}"></path> </g><g opacity="0.15"> <path d="M48 47.5001H0" stroke="${stroke}"></path> </g></svg>`;
    },
  },

  // 4. Subdivided Mesh Grid
  {
    id: 'mesh',
    name: 'Subdivided Mesh',
    description: 'Fine technical grid with subdivided coordinates',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <path d="M48 23.5H0" stroke="#1C1F21"></path> <path d="M48 47.5001H0" stroke="#1C1F21"></path> </g><g opacity="0.15"> <path d="M23.5 0V48" stroke="#1C1F21"></path> <path d="M11.5 0V48" stroke="#1C1F21"></path> <path d="M47.5 0V48" stroke="#1C1F21"></path> <path d="M35.5 0V48" stroke="#1C1F21"></path> </g><g opacity="0.15"> <path d="M47.5 0V48" stroke="#1C1F21"></path> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const stroke = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.15"> <path d="M48 23.5H0" stroke="${stroke}"></path> <path d="M48 47.5001H0" stroke="${stroke}"></path> </g><g opacity="0.15"> <path d="M23.5 0V48" stroke="${stroke}"></path> <path d="M11.5 0V48" stroke="${stroke}"></path> <path d="M47.5 0V48" stroke="${stroke}"></path> <path d="M35.5 0V48" stroke="${stroke}"></path> </g><g opacity="0.15"> <path d="M47.5 0V48" stroke="${stroke}"></path> </g></svg>`;
    },
  },

  // 5. Dashed Blueprint
  {
    id: 'dashed',
    name: 'Blueprint Dashed',
    description: 'Architectural dashed lines for engineering graphs',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 43V46H47V43H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 37V40H47V37H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 43V46H23V43H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 31V34H47V31H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 25V28H47V25H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 19V22H47V19H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 13V16H47V13H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 7V10H47V7H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 1V4H47V1H48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 37V40H23V37H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M4 48L1 48L1 47L4 47L4 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 31V34H23V31H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 25V28H23V25H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 19V22H23V19H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 13V16H23V13H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 7V10H23V7H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 1V4H23V1H24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 48L7 48L7 47L10 47L10 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 48L13 48L13 47L16 47L16 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M22 48L19 48L19 47L22 47L22 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M28 48L25 48L25 47L28 47L28 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M34 48L31 48L31 47L34 47L34 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M40 48L37 48L37 47L40 47L40 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M46 48L43 48L43 47L46 47L46 48Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M4 24L1 24L1 23L4 23L4 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 24L7 24L7 23L10 23L10 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 24L13 24L13 23L16 23L16 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M22 24L19 24L19 23L22 23L22 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M28 24L25 24L25 23L28 23L28 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M34 24L31 24L31 23L34 23L34 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M40 24L37 24L37 23L40 23L40 24Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M46 24L43 24L43 23L46 23L46 24Z" fill="#1C1F21"></path> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const fill = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.15"> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 43V46H47V43H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 37V40H47V37H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 43V46H23V43H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 31V34H47V31H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 25V28H47V25H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 19V22H47V19H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 13V16H47V13H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 7V10H47V7H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 1V4H47V1H48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 37V40H23V37H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M4 48L1 48L1 47L4 47L4 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 31V34H23V31H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 25V28H23V25H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 19V22H23V19H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 13V16H23V13H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 7V10H23V7H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 1V4H23V1H24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 48L7 48L7 47L10 47L10 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 48L13 48L13 47L16 47L16 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M22 48L19 48L19 47L22 47L22 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M28 48L25 48L25 47L28 47L28 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M34 48L31 48L31 47L34 47L34 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M40 48L37 48L37 47L40 47L40 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M46 48L43 48L43 47L46 47L46 48Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M4 24L1 24L1 23L4 23L4 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 24L7 24L7 23L10 23L10 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 24L13 24L13 23L16 23L16 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M22 24L19 24L19 23L22 23L22 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M28 24L25 24L25 23L28 23L28 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M34 24L31 24L31 23L34 23L34 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M40 24L37 24L37 23L40 23L40 24Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M46 24L43 24L43 23L46 23L46 24Z" fill="${fill}"></path> </g></svg>`;
    },
  },

  // 6. Checkerboard
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    description: 'Subtle checker tiles for transparent workflows',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.05"> <g clip-path="url(#clip0_8_98458)"> <path d="M24 0H0V24H24V0Z" fill="#1C1F21"></path> <path d="M48 24H24V48H48V24Z" fill="#1C1F21"></path> </g> <defs> <clipPath id="clip0_8_98458"> <rect width="48" height="48" fill="white"></rect> </clipPath> </defs> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const fill = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.06"> <g clip-path="url(#clip0_8_98458)"> <path d="M24 0H0V24H24V0Z" fill="${fill}"></path> <path d="M48 24H24V48H48V24Z" fill="${fill}"></path> </g> <defs> <clipPath id="clip0_8_98458"> <rect width="48" height="48" fill="white"></rect> </clipPath> </defs> </g></svg>`;
    },
  },

  // 7. Cross Dot (Single Center Cross)
  {
    id: 'cross-dot',
    name: 'Center Cross',
    description: 'Minimal centered cross points',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <path d="M22 26H21V25H22V26ZM26 26H25V25H26V26ZM23 25H22V24H23V25ZM25 25H24V24H25V25ZM24 24H23V23H24V24ZM23 23H22V22H23V23ZM25 23H24V22H25V23ZM22 22H21V21H22V22ZM26 22H25V21H26V22Z" fill="#0E0E0E"></path> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const fill = isDark ? '#ffffff' : '#0E0E0E';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.18"> <path d="M22 26H21V25H22V26ZM26 26H25V25H26V26ZM23 25H22V24H23V25ZM25 25H24V24H25V25ZM24 24H23V23H24V24ZM23 23H22V22H23V23ZM25 23H24V22H25V23ZM22 22H21V21H22V22ZM26 22H25V21H26V22Z" fill="${fill}"></path> </g></svg>`;
    },
  },

  // 8. Dense Diamond Dots Array
  {
    id: 'dot-matrix',
    name: 'Dense Matrix',
    description: 'Fine high-density matrix of diamond points',
    svgRaw: DOT_MATRIX_RAW,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const fill = isDark ? '#ffffff' : '#0E0E0E';
      return DOT_MATRIX_RAW
        .replace(/fill="#fafafa"/g, `fill="${bg}"`)
        .replace(/fill="#0E0E0E"/g, `fill="${fill}"`);
    },
  },

  // 9. Plus Markers Grid (Crosshairs)
  {
    id: 'plus-cross',
    name: 'Crosshairs Grid',
    description: 'Plus coordinate markers at grid intersections',
    svgRaw: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="#fafafa" opacity="1"/><g opacity="0.15"> <g clip-path="url(#clip0_82_37169)"> <path fill-rule="evenodd" clip-rule="evenodd" d="M0 37H-1V47H-11V48H-1V58H0V48H10V47H0V37Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 -11H47V-1H37V0H47V10H48V0H58V-1H48V-11Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 37H47V47H37V48H47V58H48V48H58V47H48V37Z" fill="#1C1F21"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 13H23V23H13V24H23V34H24V24H34V23H24V13Z" fill="#1C1F21"></path> </g> <defs> <clipPath id="clip0_82_37169"> <rect width="48" height="48" fill="white"></rect> </clipPath> </defs> </g></svg>`,
    getSvg: (isDark: boolean) => {
      const bg = isDark ? '#0a0d14' : '#fafafa';
      const fill = isDark ? '#ffffff' : '#1C1F21';
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect width="48" height="48" fill="${bg}" opacity="1"/><g opacity="0.18"> <g clip-path="url(#clip0_82_37169)"> <path fill-rule="evenodd" clip-rule="evenodd" d="M0 37H-1V47H-11V48H-1V58H0V48H10V47H0V37Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 -11H47V-1H37V0H47V10H48V0H58V-1H48V-11Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M48 37H47V47H37V48H47V58H48V48H58V47H48V37Z" fill="${fill}"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 13H23V23H13V24H23V34H24V24H34V23H24V13Z" fill="${fill}"></path> </g> <defs> <clipPath id="clip0_82_37169"> <rect width="48" height="48" fill="white"></rect> </clipPath> </defs> </g></svg>`;
    },
  },
];

/**
 * Encodes an SVG string into a valid CSS data URI
 */
export function getSvgDataUri(svgString: string): string {
  const cleaned = svgString.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
  return `url("data:image/svg+xml,${encodeURIComponent(cleaned)}")`;
}

/**
 * Returns the CSS background URL for a given pattern ID and theme
 */
export function getPatternDataUri(patternId: string, isDark: boolean): string {
  const pattern = CANVAS_BACKGROUNDS.find((p) => p.id === patternId) || CANVAS_BACKGROUNDS[2];
  const svg = pattern.getSvg(isDark);
  return getSvgDataUri(svg);
}
