export const SCENE = Object.freeze({ w: 320, h: 180 });

const obj = (id, section, labelKey, x, y, w, h) =>
  Object.freeze({ id, section, labelKey, rect: Object.freeze({ x, y, w, h }) });

export const OBJECTS = Object.freeze([
  obj('chalkboard', 'ai', 'room.ai', 128, 28, 46, 38),
  obj('menu', 'experience', 'room.experience', 32, 128, 26, 20),
  obj('poster', 'building', 'room.building', 18, 26, 36, 50),
  obj('tray', 'academic', 'room.academic', 148, 86, 30, 12),
  obj('diploma', 'education', 'room.education', 96, 34, 26, 20),
  obj('jukebox', 'skills', 'room.skills', 256, 60, 32, 58),
  obj('door', 'contact', 'room.contact', 292, 40, 26, 78),
  obj('bell', null, 'room.bell', 233, 85, 15, 13),
]);
