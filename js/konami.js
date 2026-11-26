const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

export function createKonami(onMatch) {
  let recent = [];
  return (key) => {
    if (typeof key !== 'string') return;
    recent.push(key.toLowerCase());
    if (recent.length > SEQ.length) recent.shift();
    if (recent.length === SEQ.length && recent.every((k, i) => k === SEQ[i])) {
      recent = [];
      onMatch();
    }
  };
}
