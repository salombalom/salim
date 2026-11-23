/**
 * أيقونات التطبيق (Lucide) — خطية رفيعة. لإضافة أيقونة: استوردها هنا وأضفها إلى ICONS.
 * تصفح الأيقونات: https://lucide.dev/icons
 */
import type { LucideIcon } from 'lucide-react-native';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Feather from 'lucide-react-native/icons/feather';
import Sigma from 'lucide-react-native/icons/sigma';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Languages from 'lucide-react-native/icons/languages';
import Compass from 'lucide-react-native/icons/compass';
import Atom from 'lucide-react-native/icons/atom';
import TestTubeDiagonal from 'lucide-react-native/icons/test-tube-diagonal';
import Leaf from 'lucide-react-native/icons/leaf';
import Landmark from 'lucide-react-native/icons/landmark';
import House from 'lucide-react-native/icons/house';
import Target from 'lucide-react-native/icons/target';
import Bookmark from 'lucide-react-native/icons/bookmark';
import UserRound from 'lucide-react-native/icons/user-round';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import X from 'lucide-react-native/icons/x';
import Check from 'lucide-react-native/icons/check';
import Play from 'lucide-react-native/icons/play';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Clock from 'lucide-react-native/icons/clock';
import Flame from 'lucide-react-native/icons/flame';
import Award from 'lucide-react-native/icons/award';
import BookOpen from 'lucide-react-native/icons/book-open';
import FileText from 'lucide-react-native/icons/file-text';
import CirclePlay from 'lucide-react-native/icons/circle-play';
import ClipboardCheck from 'lucide-react-native/icons/clipboard-check';
import LogOut from 'lucide-react-native/icons/log-out';
import Info from 'lucide-react-native/icons/info';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Users from 'lucide-react-native/icons/users';
import Sun from 'lucide-react-native/icons/sun';
import Moon from 'lucide-react-native/icons/moon';
import SunMoon from 'lucide-react-native/icons/sun-moon';
import Volume2 from 'lucide-react-native/icons/volume-2';
import Code from 'lucide-react-native/icons/code';
import Mail from 'lucide-react-native/icons/mail';
import Phone from 'lucide-react-native/icons/phone';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Library from 'lucide-react-native/icons/library';
import ListOrdered from 'lucide-react-native/icons/list-ordered';
import PenLine from 'lucide-react-native/icons/pen-line';
import Scale from 'lucide-react-native/icons/scale';
import Trophy from 'lucide-react-native/icons/trophy';
import Inbox from 'lucide-react-native/icons/inbox';
import Heart from 'lucide-react-native/icons/heart';
import Repeat from 'lucide-react-native/icons/repeat';
import UserCog from 'lucide-react-native/icons/user-cog';
import Type from 'lucide-react-native/icons/type';
import Palette from 'lucide-react-native/icons/palette';
import Vibrate from 'lucide-react-native/icons/vibrate';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import FileSearch from 'lucide-react-native/icons/file-search';
import Lock from 'lucide-react-native/icons/lock';
import Baby from 'lucide-react-native/icons/baby';
import Shuffle from 'lucide-react-native/icons/shuffle';

export const ICONS = {
  MoonStar,
  Feather,
  Sigma,
  FlaskConical,
  Languages,
  Compass,
  Atom,
  TestTubeDiagonal,
  Leaf,
  Landmark,
  House,
  Target,
  Bookmark,
  UserRound,
  ChevronLeft,
  ChevronDown,
  X,
  Check,
  Play,
  RotateCcw,
  Clock,
  Flame,
  Award,
  BookOpen,
  FileText,
  CirclePlay,
  ClipboardCheck,
  LogOut,
  Info,
  ShieldCheck,
  GraduationCap,
  Users,
  Sun,
  Moon,
  SunMoon,
  Volume2,
  Code,
  Mail,
  Phone,
  ArrowLeft,
  CircleCheck,
  CircleX,
  Lightbulb,
  Hourglass,
  Library,
  ListOrdered,
  PenLine,
  Scale,
  Trophy,
  Inbox,
  Heart,
  Repeat,
  UserCog,
  Type,
  Palette,
  Vibrate,
  CircleAlert,
  FileSearch,
  Lock,
  Baby,
  Shuffle,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
