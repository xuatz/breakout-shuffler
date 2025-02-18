const adjectives = [
  'Happy', 'Clever', 'Brave', 'Calm', 'Eager',
  'Gentle', 'Kind', 'Lively', 'Proud', 'Wise',
  'Bold', 'Bright', 'Cheerful', 'Friendly', 'Jolly',
  'Merry', 'Peaceful', 'Polite', 'Silly', 'Sweet',
  'Adventurous', 'Curious', 'Dynamic', 'Energetic', 'Fearless',
  'Graceful', 'Honest', 'Inventive', 'Joyful', 'Keen',
  'Logical', 'Mindful', 'Noble', 'Optimistic', 'Patient',
  'Quick', 'Reliable', 'Sincere', 'Thoughtful', 'Unique',
  'Vibrant', 'Witty', 'Zealous', 'Agile', 'Brilliant',
  'Creative', 'Diligent', 'Elegant', 'Focused', 'Generous'
];

const nouns = [
  'Panda', 'Tiger', 'Lion', 'Eagle', 'Dolphin',
  'Fox', 'Wolf', 'Bear', 'Owl', 'Penguin',
  'Koala', 'Rabbit', 'Deer', 'Seal', 'Whale',
  'Hawk', 'Duck', 'Swan', 'Dove', 'Robin',
  'Elephant', 'Giraffe', 'Kangaroo', 'Leopard', 'Monkey',
  'Octopus', 'Parrot', 'Raccoon', 'Squirrel', 'Turtle',
  'Unicorn', 'Zebra', 'Antelope', 'Butterfly', 'Cheetah',
  'Dragon', 'Falcon', 'Gazelle', 'Hedgehog', 'Iguana',
  'Jaguar', 'Kiwi', 'Lynx', 'Meerkat', 'Narwhal',
  'Otter', 'Phoenix', 'Quokka', 'Rhino', 'Salamander'
];

export function generateRandomName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${adjective}${noun}${number}`;
}
