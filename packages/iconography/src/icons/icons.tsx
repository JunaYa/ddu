import { Icon } from "@iconify/react";
import {
  ActivitySquare,
  AlertCircle,
  AlertTriangle,
  AppWindow,
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Atom,
  AtSign,
  BarChart3,
  Bell,
  BellOff,
  Bold,
  Book,
  Bookmark,
  BookmarkPlus,
  BookOpen,
  BookOpenText,
  Bot,
  Box,
  Braces,
  Brain,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  CircleX,
  CircuitBoard,
  Clock,
  CloudCog,
  Code,
  Code2,
  Columns2,
  Columns3,
  Copy,
  CornerDownLeft,
  CornerUpLeft,
  CreditCard,
  Database,
  Download,
  DraftingCompass,
  Edit,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileArchive,
  FileDown,
  FileQuestion,
  FileSearch,
  FileText,
  FileWarning,
  FileX2,
  Filter,
  Flag,
  Flame,
  Folder,
  FolderInput,
  FolderKanban,
  FolderMinus,
  FolderPlus,
  GitBranch,
  GitGraph,
  Grid2x2,
  Grid3x3,
  GripVertical,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Headphones,
  Heart,
  HelpCircle,
  History,
  Home,
  Image,
  ImageDown,
  Import,
  Indent,
  Info,
  Italic,
  Keyboard,
  KeyRound,
  Languages,
  Laptop,
  Layers,
  LayoutGrid,
  LayoutPanelLeft,
  Lightbulb,
  LineChart,
  List,
  ListFilter,
  ListOrdered,
  ListTodo,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  type LucideIcon,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  MessageSquareText,
  MessagesSquare,
  Mic,
  Minimize2,
  Minus,
  Monitor,
  Moon,
  MoonStar,
  MoreHorizontal,
  MoreVertical,
  MoveHorizontal,
  MoveVertical,
  Music,
  NotebookTabs,
  OctagonX,
  Outdent,
  Package,
  PackageSearch,
  Palette,
  PanelLeft,
  PanelRightClose,
  Paperclip,
  Pilcrow,
  PlayCircle,
  Plus,
  Puzzle,
  Quote,
  Radical,
  RefreshCcw,
  RefreshCw,
  Repeat,
  ScanLine,
  Search,
  Send,
  Settings,
  Settings2,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Square,
  StickyNote,
  Store,
  Strikethrough,
  SunMedium,
  Superscript,
  Table,
  Tag,
  Target,
  Text,
  TextQuote,
  Timer,
  Trash,
  Trash2,
  Unlink,
  Upload,
  User,
  UserPlus,
  Users,
  Variable,
  Video,
  Wand2,
  Wrench,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type AppIcon = LucideIcon;
export type LucideIconType = AppIcon;

export type IconName = keyof typeof iconMap;

type IconProps = Omit<ComponentPropsWithoutRef<LucideIcon>, "icon" | "name">;

type IconWrapperProps = IconProps & {
  icon: IconName;
};

export type IconRendererProps = IconProps & {
  name: IconName;
};

export type IconBadgeProps = HTMLAttributes<HTMLDivElement> & {
  icon: IconName;
  iconClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "muted" | "primary" | "destructive";
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Helper function to create Iconify icons
const createIconifyIcon = (iconName: string): AppIcon => {
  const IconifyIcon = forwardRef<SVGSVGElement, IconProps>(
    (
      {
        absoluteStrokeWidth: _absoluteStrokeWidth,
        className,
        color,
        height,
        size,
        strokeWidth: _strokeWidth,
        style,
        width,
        ...props
      },
      ref,
    ) => (
      <Icon
        {...(props as ComponentProps<typeof Icon>)}
        className={className}
        color={color}
        height={height ?? size}
        icon={iconName}
        ref={ref}
        style={style}
        width={width ?? size}
      />
    ),
  );

  IconifyIcon.displayName = `IconifyIcon(${iconName})`;
  return IconifyIcon;
};

const CollectionIcon = createIconifyIcon("material-symbols:inventory-2-outline-rounded");
const ArtifactIcon = createIconifyIcon("material-symbols:category-outline-rounded");
const PinIcon = createIconifyIcon("material-symbols:keep-outline-rounded");
const PinOffIcon = createIconifyIcon("material-symbols:keep-off-outline-rounded");
const ArtifactAudioIcon = createIconifyIcon("material-symbols:audio-file-outline-rounded");
const ArtifactCodeIcon = createIconifyIcon("material-symbols:code-blocks-outline-rounded");
const ArtifactFileIcon = createIconifyIcon("material-symbols:description-outline-rounded");
const ArtifactImageIcon = createIconifyIcon("material-symbols:image-outline-rounded");
const ImageOffIcon = createIconifyIcon("material-symbols:broken-image-outline-rounded");
const ArtifactPresentationIcon = createIconifyIcon("lucide:presentation");
const ArtifactSpreadsheetIcon = createIconifyIcon("material-symbols:table-chart-outline-rounded");
const ArtifactVideoIcon = createIconifyIcon("material-symbols:smart-display-outline-rounded");
const NewChatIcon = createIconifyIcon("material-symbols:edit-square-outline-rounded");
const NewNoteIcon = createIconifyIcon("material-symbols:add-circle-outline-rounded");
const NoteIcon = createIconifyIcon("material-symbols:book-4-outline-rounded");
const SaveNoteIcon = createIconifyIcon("material-symbols:add-notes-outline-rounded");
const PlayIcon = createIconifyIcon("material-symbols:play-arrow-rounded");
const PauseIcon = createIconifyIcon("material-symbols:pause-rounded");
const PlaylistPlayIcon = createIconifyIcon("material-symbols:playlist-play-rounded");
const AgentChatIcon = createIconifyIcon("ri:chat-smile-ai-line");
const AgentChatFilledIcon = createIconifyIcon("ri:chat-smile-ai-fill");
const SuggestionIcon = createIconifyIcon("material-symbols:tips-and-updates-outline-rounded");
const BillingFeaturedIcon = createIconifyIcon("material-symbols:workspace-premium-outline-rounded");
const BillingLowCreditsIcon = createIconifyIcon("material-symbols:warning-outline-rounded");
const MaterialArrowOutwardIcon = createIconifyIcon("material-symbols:arrow-outward-rounded");
const MaterialCloseIcon = createIconifyIcon("material-symbols:close-rounded");
const MaterialSparkleIcon = createIconifyIcon("material-symbols:auto-awesome-rounded");
const MaterialLinkIcon = createIconifyIcon("material-symbols:link-rounded");
const MaterialSkipForwardIcon = createIconifyIcon("material-symbols:skip-next-rounded");
const MaterialSkipBackIcon = createIconifyIcon("material-symbols:skip-previous-rounded");
const BugReportIcon = createIconifyIcon("material-symbols:bug-report-outline-rounded");
const StatusIncompleteIcon = createIconifyIcon("material-symbols:radio-button-unchecked-rounded");
const StatusSuccessIcon = createIconifyIcon("material-symbols:check-circle-rounded");
const StatusWarningIcon = createIconifyIcon("material-symbols:error-rounded");
const StatusDangerIcon = createIconifyIcon("material-symbols:dangerous-rounded");
const ThumbsUpIcon = createIconifyIcon("material-symbols:thumb-up-outline-rounded");
const ThumbsUpFilledIcon = createIconifyIcon("material-symbols:thumb-up-rounded");
const ThumbsDownIcon = createIconifyIcon("material-symbols:thumb-down-outline-rounded");
const ThumbsDownFilledIcon = createIconifyIcon("material-symbols:thumb-down-rounded");
// Semantic action/widget icons. Names describe the app-level role, not the
// glyph or icon set, so the mapping below can switch icon sets (Material
// Symbols today; rounded family, outline preferred over fill) without changing
// any call site.
const DragIcon = createIconifyIcon("material-symbols:drag-indicator");
const ResizeIcon = createIconifyIcon("material-symbols:aspect-ratio-outline-rounded");
const ExpandIcon = createIconifyIcon("material-symbols:open-in-full-rounded");
const RemoveIcon = createIconifyIcon("material-symbols:close-rounded");
const StatsIcon = createIconifyIcon("material-symbols:insert-chart-outline-rounded");
const InboxIcon = createIconifyIcon("material-symbols:inbox-outline-rounded");

const iconMap = {
  // Semantic product aliases
  agentChat: AgentChatIcon,
  agentChatFilled: AgentChatFilledIcon,
  artifact: ArtifactIcon,
  artifactAudio: ArtifactAudioIcon,
  artifactCode: ArtifactCodeIcon,
  artifactFallback: ArtifactFileIcon,
  artifactFile: ArtifactFileIcon,
  artifactImage: ArtifactImageIcon,
  artifactPresentation: ArtifactPresentationIcon,
  artifactSpreadsheet: ArtifactSpreadsheetIcon,
  artifactVideo: ArtifactVideoIcon,
  // `code2` / `presentation` are the shared web+mobile names for the agent
  // capability tiles (PI-1049/PI-1050); mobile already registers both, so
  // the two action tables stay line-for-line diffable.
  code2: ArtifactCodeIcon,
  presentation: ArtifactPresentationIcon,
  collection: CollectionIcon,
  conversation: MessageCircle,
  newChat: NewChatIcon,
  newNote: NewNoteIcon,
  note: NoteIcon,
  pin: PinIcon,
  pinOff: PinOffIcon,
  saveNote: SaveNoteIcon,
  suggestion: SuggestionIcon,
  billingFeatured: BillingFeaturedIcon,
  billingLowCredits: BillingLowCreditsIcon,
  materialArrowOutward: MaterialArrowOutwardIcon,
  materialClose: MaterialCloseIcon,
  materialSparkle: MaterialSparkleIcon,
  link: MaterialLinkIcon,
  playlistPlay: PlaylistPlayIcon,
  skipBack: MaterialSkipBackIcon,
  skipForward: MaterialSkipForwardIcon,
  bug: BugReportIcon,
  statusIncomplete: StatusIncompleteIcon,
  statusSuccess: StatusSuccessIcon,
  statusWarning: StatusWarningIcon,
  statusDanger: StatusDangerIcon,
  drag: DragIcon,
  resize: ResizeIcon,
  expand: ExpandIcon,
  remove: RemoveIcon,
  stats: StatsIcon,
  inbox: InboxIcon,

  // Lucide React icons
  timer: Timer,
  layoutGrid: LayoutGrid,
  helpCircle: HelpCircle,
  arrowRightLeft: ArrowRightLeft,
  keyRound: KeyRound,
  mail: Mail,
  logOut: LogOut,
  import: Import,
  checkSquare: CheckSquare,
  alertCircle: AlertCircle,
  arrowUpDown: ArrowUpDown,
  folderPlus: FolderPlus,
  folderInput: FolderInput,
  arrowRight: ArrowRight,
  lock: Lock,
  building2: Building2,
  fileSearch: FileSearch,
  scanLine: ScanLine,
  messageSquareText: MessageSquareText,
  activitySquare: ActivitySquare,
  bookOpenText: BookOpenText,
  packageSearch: PackageSearch,
  circuitBoard: CircuitBoard,
  barChart3: BarChart3,
  wrench: Wrench,
  cloudCog: CloudCog,
  messageSquarePlus: MessageSquarePlus,
  atom: Atom,
  atSign: AtSign,
  paperclip: Paperclip,
  send: Send,
  fileImage: ArtifactImageIcon,
  fileVideo: ArtifactVideoIcon,
  brain: Brain,
  database: Database,
  draftingCompass: DraftingCompass,
  fileCode: ArtifactCodeIcon,
  fileArchive: FileArchive,
  fileSpreadsheet: ArtifactSpreadsheetIcon,
  headphones: Headphones,
  gitBranch: GitBranch,
  layers: Layers,
  variable: Variable,
  moreVertical: MoreVertical,
  more: MoreHorizontal,
  moreHorizontal: MoreHorizontal,
  share: Share2,
  calendar: Calendar,
  folder: Folder,
  refreshCcw: RefreshCcw,
  info: Info,
  checkCircle: CheckCircle,
  zap: Zap,
  play: PlayIcon,
  pause: PauseIcon,
  playCircle: PlayCircle,
  add: Plus,
  arrowUpRight: ArrowUpRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  bell: Bell,
  billing: CreditCard,
  list: List,
  bookOpen: BookOpen,
  chevronFirst: ChevronFirst,
  chevronLast: ChevronLast,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  chevronsUpDown: ChevronsUpDown,
  check: Check,
  circleAlert: CircleAlert,
  circleX: CircleX,
  close: X,
  code: Code,
  lucideCode2: Code2,
  columns3: Columns3,
  copy: Copy,
  dashboard: LayoutPanelLeft,
  download: Download,
  edit: Edit,
  ellipsis: Ellipsis,
  externalLink: ExternalLink,
  eye: Eye,
  eyeOff: EyeOff,
  filter: Filter,
  listFilter: ListFilter,
  repeat: Repeat,
  square: Square,
  tag: Tag,
  bot: Bot,
  book: Book,
  appWindow: AppWindow,
  thumbsUp: ThumbsUpIcon,
  thumbsUpFilled: ThumbsUpFilledIcon,
  thumbsDown: ThumbsDownIcon,
  thumbsDownFilled: ThumbsDownFilledIcon,
  messageSquare: MessageSquare,
  bookmark: Bookmark,
  flag: Flag,
  flame: Flame,
  circleHelp: CircleHelp,
  home: Home,
  laptop: Laptop,
  lineChart: LineChart,
  puzzle: Puzzle,
  languages: Languages,
  image: Image,
  imageDown: ImageDown,
  imageOff: ImageOffIcon,
  messages: MessagesSquare,
  moon: Moon,
  package: Package,
  file: File,
  lucideFileText: FileText,
  fileDown: FileDown,
  plus: Plus,
  fileText: ArtifactFileIcon,
  search: Search,
  settings: Settings,
  settings2: Settings2,
  shield: Shield,
  spinner: Loader2,
  sun: SunMedium,
  trash: Trash,
  lucideTrash2: Trash2,
  upload: Upload,
  mic: Mic,
  maximize: Maximize2,
  minimize: Minimize2,
  user: User,
  users: Users,
  alertTriangle: AlertTriangle,
  sidebar: PanelRightClose,
  store: Store,

  // Block editor chrome (apps/web components/editor)
  bold: Bold,
  braces: Braces,
  cornerDownLeft: CornerDownLeft,
  grid2x2: Grid2x2,
  grid3x3: Grid3x3,
  gripVertical: GripVertical,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading4,
  heading5: Heading5,
  heading6: Heading6,
  indent: Indent,
  italic: Italic,
  listOrdered: ListOrdered,
  listTodo: ListTodo,
  outdent: Outdent,
  pilcrow: Pilcrow,
  quote: Quote,
  radical: Radical,
  strikethrough: Strikethrough,
  superscript: Superscript,
  table: Table,
  text: Text,
  unlink: Unlink,

  // Additional icons from other components
  bellOff: BellOff,
  box: Box,
  archive: Archive,
  archiveRestore: ArchiveRestore,
  arrowLeft: ArrowLeft,
  audioLines: Headphones,
  bookmarkPlus: BookmarkPlus,
  clock: Clock,
  columns2: Columns2,
  cornerUpLeft: CornerUpLeft,
  fileQuestion: FileQuestion,
  fileWarning: FileWarning,
  fileX: FileX2,
  folderMinus: FolderMinus,
  folderKanban: FolderKanban,
  gitGraph: GitGraph,
  heart: Heart,
  hash: Hash,
  history: History,
  keyboard: Keyboard,
  lightbulb: Lightbulb,
  logIn: LogIn,
  minus: Minus,
  monitor: Monitor,
  moonStar: MoonStar,
  moveHorizontal: MoveHorizontal,
  moveVertical: MoveVertical,
  music: Music,
  notebookTabs: NotebookTabs,
  octagonX: OctagonX,
  palette: Palette,
  panelLeft: PanelLeft,
  rotateCcw: RefreshCcw,
  refreshCw: RefreshCw,
  smartphone: Smartphone,
  sparkles: Sparkles,
  stickyNote: StickyNote,
  target: Target,
  textQuote: TextQuote,
  userPlus: UserPlus,
  video: Video,
  wand: Wand2,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,

  // Product-specific non-Lucide aliases. Brand/social catalogs live in their
  // dedicated iconography submodules so product bundles do not carry them.
  googleDrive: createIconifyIcon("simple-icons:googledrive"),
  notion: createIconifyIcon("simple-icons:notion"),
  obsidian: createIconifyIcon("simple-icons:obsidian"),
  twitter: createIconifyIcon("lucide:twitter"),
  xLogo: createIconifyIcon("simple-icons:x"),
  globe: createIconifyIcon("lucide:globe"),
} as const;

export function IconRenderer({ name, ...props }: IconRendererProps): ReactNode {
  const IconComponent = iconMap[name];
  return IconComponent ? <IconComponent {...props} /> : null;
}

export const iconNames = Object.keys(iconMap) as IconName[];

export function isIconName(value: string): value is IconName {
  return Object.hasOwn(iconMap, value);
}

const iconBadgeSizeClasses = {
  sm: "size-7 rounded-md [&_svg]:size-3.5",
  md: "size-9 rounded-lg [&_svg]:size-4",
  lg: "size-11 rounded-xl [&_svg]:size-5",
} as const;

const iconBadgeVariantClasses = {
  default: "border-border bg-background text-muted-foreground dark:bg-popover",
  muted: "border-transparent bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export function IconBadge({
  className,
  icon,
  iconClassName,
  size = "md",
  variant = "default",
  ...props
}: IconBadgeProps): ReactNode {
  return (
    <div
      className={cx(
        "flex shrink-0 items-center justify-center border bg-clip-padding",
        iconBadgeSizeClasses[size],
        iconBadgeVariantClasses[variant],
        className,
      )}
      data-slot="icon-badge"
      {...props}
    >
      <IconRenderer className={cx("shrink-0", iconClassName)} name={icon} />
    </div>
  );
}

export const Icons = {
  ...iconMap,
  badge: IconBadge,
  wrapper: (props: IconWrapperProps): ReactNode => {
    const { icon, ...iconProps } = props;
    return <IconRenderer name={icon} {...iconProps} />;
  },
} as const;
