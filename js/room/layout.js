export const SCENE = Object.freeze({ w: 320, h: 180 });

const obj = (id, section, labelKey, x, y, w, h) =>
  Object.freeze({ id, section, labelKey, rect: Object.freeze({ x, y, w, h }) });

export const OBJECTS = Object.freeze([
  obj('chalkboard', 'ai', 'room.ai', 150, 26, 70, 42),
  obj('menu', 'experience', 'room.experience', 40, 138, 26, 18),
  obj('poster', 'building', 'room.building', 20, 30, 36, 50),
  obj('tray', 'academic', 'room.academic', 160, 90, 28, 10),
  obj('diploma', 'education', 'room.education', 100, 36, 26, 20),
  obj('jukebox', 'skills', 'room.skills', 256, 60, 34, 60),
  obj('door', 'contact', 'room.contact', 292, 50, 26, 80),
  obj('bell', null, 'room.bell', 230, 88, 12, 12),
]);
