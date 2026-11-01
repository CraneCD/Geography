import {
  Earth, Landmark, Sigma, FlaskConical, Flag, Building2, MapPin, Shapes, Languages, Users, Maximize2,
  Shuffle, UserRound, Hourglass, CalendarDays, Lightbulb, Palette, Plus, Percent, ListOrdered,
  DraftingCompass, Variable, PawPrint, Scale, Atom, HeartPulse, Orbit, Telescope, Circle, Fence, Coins,
  Clock, Columns3, Ruler, MessageSquareText, Puzzle,
} from "lucide-react";

const ICONS = {
  geography: Earth, history: Landmark, logic: Sigma, science: FlaskConical,
  flags: Flag, capitals: Building2, locate: MapPin, shapes: Shapes, languages: Languages,
  population: Users, area: Maximize2, neighbours: Fence, currencies: Coins,
  people: UserRound, "who-first": Hourglass, events: CalendarDays, inventions: Lightbulb, art: Palette,
  arithmetic: Plus, fractions: Percent, sequences: ListOrdered, angle: DraftingCompass, algebra: Variable,
  clocks: Clock, roman: Columns3, units: Ruler, "word-problems": MessageSquareText, puzzles: Puzzle,
  "animals-photo": PawPrint, "animals-compare": Scale, elements: Atom, body: HeartPulse,
  "space-photo": Orbit, "space-compare": Telescope,
  mixed: Shuffle, "history-mixed": Shuffle, "logic-mixed": Shuffle, "science-mixed": Shuffle,
};

/** Line icon for a subject or mode id. Decorative: always hidden from assistive tech. */
export default function Icon({ name, size = 24, className }) {
  const Glyph = ICONS[name] ?? Circle;
  return <Glyph size={size} strokeWidth={1.6} className={className} aria-hidden="true" focusable="false" />;
}
