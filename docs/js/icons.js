const ICONS = {
  play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>',
  waveform(color) {
    return '<svg fill="' + color + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
      + '<rect x="2" y="35" width="8" height="30" rx="4"/>'
      + '<rect x="14.5" y="19" width="8" height="62" rx="4"/>'
      + '<rect x="27" y="6" width="8" height="88" rx="4"/>'
      + '<rect x="39.5" y="10" width="8" height="80" rx="4"/>'
      + '<rect x="52" y="23" width="8" height="54" rx="4"/>'
      + '<rect x="64.5" y="10" width="8" height="80" rx="4"/>'
      + '<rect x="77" y="23" width="8" height="54" rx="4"/>'
      + '<rect x="89.5" y="35" width="8" height="30" rx="4"/>'
      + '</svg>';
  },
  vinyl: '<svg fill="#222" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="50" cy="50" r="45" fill="none" stroke="#222" stroke-width="4"/>'
    + '<circle cx="50" cy="50" r="35" fill="none" stroke="#222" stroke-width="1.5"/>'
    + '<circle cx="50" cy="50" r="25" fill="none" stroke="#222" stroke-width="1.5"/>'
    + '<circle cx="50" cy="50" r="15" fill="none" stroke="#222" stroke-width="1.5"/>'
    + '<circle cx="50" cy="50" r="4" fill="#222"/>'
    + '</svg>'
};
