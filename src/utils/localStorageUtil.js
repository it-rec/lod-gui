export const GOLD = 'gold';
export const FAME = 'fame';
export const HEROS = 'heroes';
export const STORY_POINTS = 'storyPoints';

export const store = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const load = (key) => {
  return JSON.parse(window.localStorage.getItem(key));
};