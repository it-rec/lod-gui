// Small inline SVG icons. Everything draws in `currentColor` so icons inherit
// the surrounding text colour. viewBox is a uniform 24x24 grid.

const Svg = ({ children, label, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
    aria-label={label}
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconParty = (props) => (
  <Svg {...props}>
    <path
      d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"
      fill="currentColor"
      opacity="0.18"
    />
    <path {...stroke} d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
    <circle cx="12" cy="10" r="2.2" {...stroke} />
    <path {...stroke} d="M8.4 16.2c.7-1.9 2-2.9 3.6-2.9s2.9 1 3.6 2.9" />
  </Svg>
);

export const IconCoins = (props) => (
  <Svg {...props}>
    <ellipse cx="10" cy="8" rx="6" ry="3.4" fill="currentColor" opacity="0.18" />
    <ellipse cx="10" cy="8" rx="6" ry="3.4" {...stroke} />
    <path {...stroke} d="M4 8v4c0 1.9 2.7 3.4 6 3.4s6-1.5 6-3.4V8" />
    <path {...stroke} d="M8 15.6V19c0 1.9 2.7 3.4 6 3.4s6-1.5 6-3.4v-4" />
  </Svg>
);

export const IconRenown = (props) => (
  <Svg {...props}>
    <path
      d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.6 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z"
      fill="currentColor"
      opacity="0.2"
    />
    <path
      {...stroke}
      d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.6 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z"
    />
  </Svg>
);

export const IconScroll = (props) => (
  <Svg {...props}>
    <path
      d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2"
      fill="currentColor"
      opacity="0.16"
    />
    <path {...stroke} d="M8 4h9a2 2 0 012 2v13a2 2 0 01-2 2H8" />
    <path {...stroke} d="M8 4a2 2 0 00-2 2v2h4V6a2 2 0 00-2-2z" />
    <path {...stroke} d="M16 21a2 2 0 002-2M9 9.5h6M9 13h6M9 16.5h4" />
  </Svg>
);

export const IconPlus = (props) => (
  <Svg {...props}>
    <path {...stroke} d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconMinus = (props) => (
  <Svg {...props}>
    <path {...stroke} d="M5 12h14" />
  </Svg>
);

export const IconCheck = (props) => (
  <Svg {...props}>
    <path {...stroke} d="M5 12.5l4.5 4.5L19 6.5" />
  </Svg>
);

export const IconTrash = (props) => (
  <Svg {...props}>
    <path
      {...stroke}
      d="M5 7h14M10 7V5h4v2M6.5 7l.8 12a2 2 0 002 1.9h5.4a2 2 0 002-1.9L17.5 7M10 11v6M14 11v6"
    />
  </Svg>
);

export const IconChevron = (props) => (
  <Svg {...props}>
    <path {...stroke} d="M7 10l5 5 5-5" />
  </Svg>
);

export const IconRest = (props) => (
  <Svg {...props}>
    <path
      d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"
      fill="currentColor"
      opacity="0.2"
    />
    <path {...stroke} d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />
  </Svg>
);

export const IconLink = (props) => (
  <Svg {...props}>
    <path
      {...stroke}
      d="M9.5 14.5l5-5M8 12l-2 2a3 3 0 104.2 4.2l2-2M16 12l2-2A3 3 0 0013.8 5.8l-2 2"
    />
  </Svg>
);

export const IconCalendar = (props) => (
  <Svg {...props}>
    <rect x="4" y="5" width="16" height="15" rx="2" fill="currentColor" opacity="0.16" />
    <rect x="4" y="5" width="16" height="15" rx="2" {...stroke} />
    <path {...stroke} d="M4 10h16M8 3v4M16 3v4" />
    <path {...stroke} d="M8 14h0M12 14h0M16 14h0M8 17h0M12 17h0" />
  </Svg>
);

export const IconKey = (props) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.16" />
    <circle cx="8" cy="8" r="4" {...stroke} />
    <path {...stroke} d="M10.9 10.9l7.1 7.1M15 15l2-2M18 18l2-2" />
  </Svg>
);

export const IconSun = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4.3" fill="currentColor" opacity="0.22" />
    <circle cx="12" cy="12" r="4.3" {...stroke} />
    <path
      {...stroke}
      d="M12 2.5v2.5M12 19v2.5M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M2.5 12H5M19 12h2.5M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8"
    />
  </Svg>
);

export const IconSunset = (props) => (
  <Svg {...props}>
    <path d="M7 16a5 5 0 0110 0z" fill="currentColor" opacity="0.22" />
    <path {...stroke} d="M7 16a5 5 0 0110 0" />
    <path
      {...stroke}
      d="M3 16h2M19 16h2M12 3v4M12 20h9M3 20h4M5.6 8.6l1.4 1.4M18.4 8.6L17 10"
    />
  </Svg>
);

export const IconQuest = (props) => (
  <Svg {...props}>
    <path
      d="M5 4h12l-2.5 4L17 12H5z"
      fill="currentColor"
      opacity="0.18"
    />
    <path {...stroke} d="M5 4h12l-2.5 4L17 12H5z" />
    <path {...stroke} d="M5 4v17" />
  </Svg>
);

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6" fill="currentColor" opacity="0.14" />
    <circle cx="11" cy="11" r="6" {...stroke} />
    <path {...stroke} d="M15.5 15.5L20 20" />
  </Svg>
);

export const IconPencil = (props) => (
  <Svg {...props}>
    <path
      {...stroke}
      d="M4 20l1-4L17 4l3 3L8 19l-4 1z"
    />
    <path {...stroke} d="M14 7l3 3" />
  </Svg>
);

export const IconMoon = (props) => (
  <Svg {...props}>
    <path
      d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"
      fill="currentColor"
      opacity="0.22"
    />
    <path {...stroke} d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />
    <path {...stroke} d="M16 4.5l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5L13.8 6.7l1.5-.7z" />
  </Svg>
);
