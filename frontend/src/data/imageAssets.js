/**
 * Free royalty-free images from Pexels (https://www.pexels.com/license/)
 * Each image matches its room theme.
 * Some Pexels photos use custom filenames; use pexels(id, filename) for those.
 */
const pexels = (id, filename) =>
  `https://images.pexels.com/photos/${id}/${filename || `pexels-photo-${id}.jpeg`}?auto=compress&cs=tinysrgb&w=1920`

export const IMAGE_ASSETS = {
  darkRoom: pexels(4906520),     // vintage interior cozy room hotel
  library: pexels(1261180),      // top-view library with red stairs
  kitchen: pexels(14354789),     // ceramic plates on wooden table
  dungeon: pexels(7492138),
  throne: pexels(29218464),      // opulent palace interior Mumbai
  armory: pexels(35497376),      // medieval knight armor castle hallway
  tower: pexels(9278035),        // concrete medieval castle
  chapel: pexels(31343738),      // Frederiksborg castle chapel
  wineCellar: pexels(31437507),  // wine fermentation tanks cellar
  guardRoom: pexels(226746),     // man in armour (same as armory)
  nursery: pexels(7978841),      // close-up chess pieces
  gallery: pexels(2123337),      // assorted print painting lot
  alchemyLab: pexels(7979104),   // spell book close-up
  bathhouse: pexels(20586183),   // ruin ancient public bathhouse
  stables: pexels(12814742),     // head of horse
}
