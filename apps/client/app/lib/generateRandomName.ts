const adjectives = [
  'Happy',
  'Silly',
  'Clever',
  'Brave',
  'Gentle',
  'Swift',
  'Bright',
  'Wild',
  'Calm',
  'Noble',
];
const nouns = [
  'Penguin',
  'Lion',
  'Tiger',
  'Bear',
  'Owl',
  'Fox',
  'Wolf',
  'Eagle',
  'Deer',
  'Hawk',
];

export function generateRandomName(): string {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${randomAdjective} ${randomNoun} ${randomNumber}`;
}
